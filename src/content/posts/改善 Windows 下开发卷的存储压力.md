---
title: "Windows 开发卷存储优化：ReFS/NTFS 的压缩与去重实战"
slug: windows-dev-drive-storage-optimization
date: 2026-07-07T01:16:03+08:00
description: "针对 Rust 开发场景的磁盘膨胀问题，本文以“压缩”与“去重”为核心策略，系统梳理 Windows 下 ReFS DevDrive 的 ZSTD 压缩与块级去重、NTFS 的 Compact OS 及硬链接合并操作，并补充应用层通过 pnpm、Kache 共享编译产物与依赖的实践方案，实测可释放近 200GiB 空间。"
tags:
  - windows
  - dev-drive
  - storage
  - refs
  - ntfs
  - dedup
  - compression
  - rust
categories:
  - 技术分享
featured_image: https://static-a-moebako.a632079.me/20260708/b95370585b214e65c50196bf855bb9cd.avif
draft: true
---



博主最近经常使用 Rust 开发软件，而 Rust 又是一个缺乏存储优化的编译语言，导致重复占用了海量磁盘。

本文旨在通过一些通用，简单，便捷的操作来改善这方面的使用体验。

> 换句话说，只要你的磁盘不是用来存储海量图片、视频的仓储盘，都能通过本文章受益。



![WizTree的磁盘分析](https://static-a-moebako.a632079.me/20260707/4b1d6a05bb01713a521e48021f029b62.png)



## 序

要优化空间占用无非两个思路：压缩、:ruby[去重(Dedup)]。
而 :ruby[去重(Dedup)] 又分为：

* CoW（**C**opy-**o**n-**W**rite，写时复制）—— 在文件系统中，只有修改文件才会新建副本
  * 需要文件系统支持
  * 与硬链接不同：硬链接改一处、所有入口都会跟着变；CoW 则在写入时**自动分裂出新副本**、源文件不受影响——这正是它能安全去重的原因
* 块级
  * 需要 文件系统 或 操作系统 支持
  * 也是 [Windows Server Data Deduplication](https://learn.microsoft.com/en-us/windows-server/storage/data-deduplication/understand) 的实现机制
* 文件级
  * 通过计算 :ruby[哈希(Hash)] 建表，并使用 **硬链接** 来使多份文件共同使用一份存储空间
  * DISM++ 的 **硬链接合并** 功能就是做的这件事

> 小伙伴们可能会有疑问，为什么一个文件系统支持 CoW 后，依然会需要 去重 功能呢？
>
> CoW 只作用于 **复制** 行为。当你从互联网上重复下载两个完全一样的文件，此时 CoW 特性将不起作用，此时 **去重** 功能的需求就来了。



下面，我们将分别通过 **文件系统** 和 **应用** 角度来谈谈如何通过上述思路进行优化。




## 文件系统

> 通常，在这一层操作能获得大幅的空间占用效率提升。也因此，APFS、btrfs、zfs 在默认预设下就能获得比较满意的开发体验[^1]。
>
> 譬如，笔者通过在这一层的优化，能获得近 **200GiB** 的空闲空间。

Windows 下能作为开发人员使用的卷，且存在优化潜力的文件系统就两个：ReFS、NTFS。因此，exFAT、FAT32 不在讨论范围内。



如果有单独的磁盘，或者某个磁盘还拥有大量的空闲空间，可以考虑新建一个 **开发人员卷** 来获得专门优化的 ReFS 卷。

支持直接新建 :ruby[虚拟硬盘(VHDX)] 文件。然后给 VHDX 的分区，或者磁盘分区格式化为带有 :ruby[开发人员驱动器(DevDrive)] 属性的 ReFS 卷。

> VHDX 是 Windows 原生的虚拟磁盘文件，双击即可挂载成一个独立盘符。**没有多余物理磁盘时，用它就能凭空得到一个 ReFS 开发人员卷来试验**，无需对现有分区动刀。

![image-20260707194120142](https://static-a-moebako.a632079.me/20260707/0974fe3caa18aa814871e7ee6f57ada5.png)

![image-20260707194837991](https://static-a-moebako.a632079.me/20260707/771581753365888ac480d5f719370491.png)



### ReFS（DevDrive）

ReFS 是一种支持 CoW 技术，并支持压缩，透明读取，支持块级去重的文件系统。

> 这里的 **透明（Transparent）**、**在线（Online）** 指：通过操作系统的 :ruby[过滤器(Filter)]、驱动或文件系统实现——在调用如 [ReadFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile)、或更底层的 [DeviceIoControl](https://learn.microsoft.com/zh-cn/windows/win32/api/ioapiset/nf-ioapiset-deviceiocontrol) 等系统调用时，能直接读到解压后的文件内容，写入时对应用也无感。具体而言，Windows 用 **微筛选器（minifilter）** 在文件系统驱动之上挂钩文件 I/O——压缩、去重、乃至杀软的实时扫描，都是靠这一层拦截来实现「透明」的。

> 或许是出于对写入性能的考量，ReFS 当前不支持透明压缩（即文件写入时就自动压缩），也不支持即时去重。

笔者这里推荐直接创建 DevDrive 的方式获得潜在的开发人员卷优化。要查看你的卷是否为开发人员卷可以执行：
```shell
❯ fsutil devdrv query G:
这是受信任的开发人员卷。

开发人员卷受防病毒筛选器保护。

当前附加到此开发人员卷的筛选器：
    KLIF.K4W-21-24
```

> **DevDrive 不只是 ReFS**：把卷标记为「受信任」后，Microsoft Defender 会对它启用**性能模式**——实时扫描从「同步阻塞」改为「异步后台」，`cargo` / `npm` 这类海量小文件操作可提速约 30%，且文件仍会被扫描（不同于直接排除目录那样完全跳过）。
>
> 注意：**性能模式仅 Microsoft Defender 独享**。第三方杀软（如上面输出里的 Kaspersky `KLIF` 筛选器）默认仍会附加自己的筛选器、也不会自动进入性能模式；如需调优，可用 `fsutil devdrv setfiltersallowed` 管理允许附加的筛选器[^2]。

以及几个获取卷信息的常用指令：
```shell
❯ fsutil fsinfo volumeinfo G:
卷名 : Develop
卷序列号 : 0x58026a50
组件长度最大值 : 255
文件系统名 : ReFS
为读写
未精简预配
支持区分大小写的文件名
保留文件名的大小写
支持文件名中的 Unicode
保留并加强 ACL
支持稀疏文件
支持重分析点
返回句柄关闭结果信息
支持 POSIX 样式断开链接和重命名
支持流快照
支持Case-Sensitive目录
支持加密文件系统
支持带有名称的数据流
支持硬链接
支持扩展属性
支持按文件 ID 打开
支持 USN 日志
支持完整性流
支持块克隆
支持稀疏 VDL
支持文件 Ghosting

❯ fsutil fsinfo refsinfo G:
REFS 卷序列号:                0x4858027d58026a50
REFS 卷版本:                      3.14
REFS 驱动程序受支持的最大版本 :    3.14
数字扇区 :                           0x00000000773a0000
簇总数 :                           0x000000000ee74000
可用簇  :                           0x00000000068f93ab
预留的总数 :                           0x0000000000109358
每个扇区字节数  :                        512
每个物理扇区字节数 :                4096
每个簇的字节数 :                        4096
快速层数据填充百分比 :           0.0%
慢速层数据填充百分比 :           0.0%
快速层到慢速层速率(簇/秒) : 0
元数据校验和类型 :                   CHECKSUM_TYPE_CRC64
数据校验和类型 :                       CHECKSUM_TYPE_NONE
```

> 输出里的 **簇(cluster)** 是文件系统的最小分配单位（这里 `每个簇的字节数 = 4096`，即 4KB），**扇区(sector)** 则是磁盘物理层的最小读写单位；后文的压缩、去重都以「簇 / 块」为粒度进行。



#### 压缩

ReFS 支持 LZ4，ZSTD 压缩，以及支持不同的压缩级别。
```shell
❯ refsutil compression /?
---- 卷压缩管理 ----
用法: refsutil compression <drive> <[/q]>|<[/c] [/f <format>] [/e <engine>] [/cs <size>]>
/q          查询卷压缩参数。
/c          使用提供的压缩参数压缩卷。
/f          压缩使用的压缩格式。有效值:
            - LZ4、
            - ZSTD、
            - 无。
            使用“无”解压缩已压缩的卷。提供此选项时，
            必须忽略引擎和压缩区块大小。
/e          压缩使用的压缩级别，具体取决于所选的压缩格式。
            对于任何给定的压缩，忽略此参数或使用 0 来选取
            默认级别。默认值可能发生更改。
            有效值:
            - LZ4: 1、3-12。默认值: 1。
              范围 3-12 中的值使用 LZ4 HC 算法，可以取得更大的
              压缩比，但压缩速度将大幅降低。解压缩
              速度与所选压缩级别无关。
            - ZSTD: 1-22。默认值: 3。
              值越大，压缩比就越大，但压缩
              速度随之降低。大于或等于 20 的值需要更高的内存占用。解压缩
              速度与所选压缩级别无关。
/cs         压缩使用的压缩区块大小(以字节为单位)。必须为大于或
            等于卷群集大小的值的 2 次幂，但不大于 64mb。值越大，产生的
            压缩比越大，但读取性能会因为读取的数据量
            小于区块大小而下降。1mb 之后收益将急剧下降，因此
            不建议这样做。省略此参数或使用 0 将选取卷群集大小。
例如: refsutil compression /q R:
例如: refsutil compression /c /f LZ4 /e 12 /cs 524288 R:
例如: refsutil compression /c /f ZSTD /e 15 /cs 131072 R:
例如: refsutil compression /c /f ZSTD R:
例如: refsutil compression /c /f NONE R:
```

可以通过如下指令立即对卷使用 ZSTD，级别为 3（默认）进行一次压缩：
```shell
refsutil compression G: /c /f ZSTD
```

也可以通过这个指令查询当前卷的压缩状态：
```shell
❯ refsutil compression G: /q
压缩格式:                     ZSTD
压缩级别:                      3
压缩区块大小:                 AUTO
卷大小:                            954GB
卷上的总逻辑数据:           738GB
压缩数据的未压缩大小:   427GB
压缩数据的压缩大小:     190GB
估计的垃圾回收节省额:   12.3GB
压缩后的卷数据百分比:   54.9%
压缩效率:                 55.5%
压缩效率(不含 GC):        50.3%
上次压缩运行 NTSTATUS:          0x00000000
卷压缩当前已停止。
```

#### 去重

ReFS 支持 按 :ruby[块(Blocks)] 去重 的功能。

```
❯ refsutil dedup G: /?
用法: refsutil dedup <volume path/mount point> [/d] [/s] [/cpu <percentage>] [/mm]
<drive> 卷路径或装载点。
/d       Dedup 卷; 与 /s 标志互相排斥。
/s       可通过删除等效群集来扫描卷以确定可以保存多少空间。
       与 /d 标志互相排斥。
/mm       使用内存映射文件 I/O 来读取文件到 dedup。默认通过 IOCP 使用异步读取。
       必须与 /d 或 /s 标志一起使用。
/cpu       指定要使用的 CPU 的最大百分比。有效值为 [1-100]。
Eg: refsutil dedup D: /s
Eg: refsutil dedup D: /d /cpu 50
```

> 请注意：
>
> 当你使用基于 PowerShell 的 ReFS 管理工具为卷开启了 **DedupAndCompress** 的功能类型后，将无法通过 `refsutil dedup` 指令操作磁盘 [^3]。
>
> 当执行时，会出现这个错误，这是正常的：
> ```shell
> ❯ refsutil dedup G: /s
> 无法优化存储。GLE: 0x80070032
> 不支持该请求
> ```
>
> 此时，可以继续使用 PowerShell 的 ReFS 管理指令管理。
>
> 或是在 PowerShell 中关闭 去重 功能，然后再使用 `refsutil` 工具：
>
> ```shell
> ❯ Disable-ReFSDedup G:
> ```

要使用 `refsutil` 去重，可以先使用 `/s` 扫描卷：
```shell
❯ refsutil dedup G: /s
G:\ is an ReFS volume.
Using 4096 byte chunk size
Requested maximum 50% CPU utilization
Creating weak references for all candidate ranges.
All candidates processed.
Estimating space savings on G:\...
Status: 98% complete, 1695681 read, 1715457 candidates
Estimation complete (duration: 36.18 minutes).

Error counts:
Hash index update errors: 117389
Hash index update transaction errors: 0
Maximum Tx retries due to log file full: 0
FSCTL_DUPLICATE_CLUSTER errors: 0
Source has maximum allowed references, no longer dedupable: 108332
Source invalid errors: 0
Target invalid errors: 0
Not supported errors: 0
VCN->LCN mapping changed errors: 7733

Undedupable data counts:
Stream reserved LCNs: 0
Read only LCNs: 0
Invalid (allocated, but undefined data) LCNs: 3

Processed file ranges: 1695681
Bytes deduped during optimization: 0.00 B
Processed data size (logical): 683.17 GiB
Total shared data: 151.77 GiB
Space savings percent (no compression): 22%
```



然后再使用 `/d` 进行真实去重：

```shell
❯ refsutil dedup G: /d
G:\ is an ReFS volume.
Using 4096 byte chunk size
Requested maximum 50% CPU utilization
Creating weak references for all candidate ranges.
All candidates processed.
Optimizing files on G:\...
Status: 100% complete, 1689588 read, 1689588 candidates
Optimization complete (duration: 44.73 minutes).

Error counts:
Hash index update errors: 114742
Hash index update transaction errors: 561
Maximum Tx retries due to log file full: 0
FSCTL_DUPLICATE_CLUSTER errors: 1891
Source has maximum allowed references, no longer dedupable: 112073
Source invalid errors: 0
Target invalid errors: 0
Not supported errors: 0
VCN->LCN mapping changed errors: 27

Undedupable data counts:
Stream reserved LCNs: 0
Read only LCNs: 0
Invalid (allocated, but undefined data) LCNs: 1

Processed file ranges: 1689588
Bytes deduped during optimization: 139.99 GiB
Processed data size (logical): 675.11 GiB
Total shared data: 149.60 GiB
Space savings percent (no compression): 22%
```

> 输出里成片的 `Source has maximum allowed references, no longer dedupable` 是**正常现象**，不是报错：ReFS 单个数据块有最大引用计数上限，被极度重复引用的块达到上限后就不再继续共享。



#### 定期计划

上文讲过，ReFS 没有透明压缩，透明去重，所有的操作都需要手动异步执行。不过好在，Microsoft 在 PowerShell 提供了管理工具[^4]可以开启管理计划。

在本节主要使用其中的 `Enable-ReFSDedup`、`Set-ReFSDedupSchedule`、`Start-ReFSDedupJob`、`Get-ReFSDedupStatus` 指令。

首先，检查当前的状态：

```powershell
❯ Get-ReFSDedupStatus -Volume "G:" | Format-List *

PSComputerName     : localhost
RunspaceId         : 680f3fe1-de6f-4194-9319-5b412e3b8a4f
PSShowComputerName : False
Volume             : G:
Enabled            : False
Size               : 564530376704
```

如上所示，如果显示当前 `Enabled: False` ，则需要手动开启：

```powershell
Enable-ReFSDedup -Volume "G:" -Type DedupAndCompress
```

这时候，就可以获取到磁盘状态了：
```shell
❯ Get-ReFSDedupStatus -Volume "G:" | Format-List *

PSComputerName                           : localhost
RunspaceId                               : 680f3fe1-de6f-4194-9319-5b412e3b8a4f
PSShowComputerName                       : False
Volume                                   : G:
Enabled                                  : True
Type                                     : DedupAndCompress
Running                                  : False
State                                    : Idle
Progress                                 : 0
Size                                     : 564549173248
TotalSavings                             : 22025334784
ProcessedOnLastRun                       : 36039757824
SavingsOnLastRun                         : 2168557568
LastRunTime                              : 2026/7/7 3:00:00
LastRunDuration                          : 00:09:36.1421747
LastRunStatus                            : 0
NextRunTime                              : 1601/1/1 8:00:00
FullRun                                  : False
CompressionFormat                        : ZSTD
CompressionLevel                         : 3
CompressionChunkSize                     : 0
VolumeClusterSizeBytes                   : 4096
VolumeTotalClusters                      : 250036224
VolumeTotalAllocatedClusters             : 125243880
VolumeTotalAllocatedCompressibleClusters : 109641776
VolumeTotalInUseCompressibleClusters     : 85067907
VolumeTotalCompressedClusters            : 49038358
VolumeTotalCompressionSavings            : 248231600128
VolumeCompressionInProgress              : False
```



创建一个  ZSTD 压缩（等级3），只处理 72 小时前的文件，最多使用 10% CPU，每日 03\:00 执行，且最长执行 2 小时的计划任务：

```powershell
Set-ReFSDedupSchedule `
  -Volume "G:" `
  -Start "03:00" `
  -Days EveryDay `
  -Duration 02:00:00 `
  -CpuPercentage 10 `
  -MinimumLastModifiedTimeHours 72 `
  -CompressionFormat ZSTD `
  -CompressionLevel 3
```



可以观测到 `NextRunTime` 变为下一天，那就是起作用了：

```shell
❯ Get-ReFSDedupStatus -Volume "G:" | Format-List *

PSComputerName                           : localhost
RunspaceId                               : 680f3fe1-de6f-4194-9319-5b412e3b8a4f
PSShowComputerName                       : False
Volume                                   : G:
Enabled                                  : True
Type                                     : DedupAndCompress
Running                                  : False
State                                    : Idle
Progress                                 : 0
Size                                     : 564552425472
TotalSavings                             : 22025334784
ProcessedOnLastRun                       : 36039757824
SavingsOnLastRun                         : 2168557568
LastRunTime                              : 2026/7/7 3:00:00
LastRunDuration                          : 00:09:36.1421747
LastRunStatus                            : 0
NextRunTime                              : 2026/7/8 3:00:00
FullRun                                  : False
CompressionFormat                        : ZSTD
CompressionLevel                         : 3
CompressionChunkSize                     : 0
VolumeClusterSizeBytes                   : 4096
VolumeTotalClusters                      : 250036224
VolumeTotalAllocatedClusters             : 125244662
VolumeTotalAllocatedCompressibleClusters : 109641776
VolumeTotalInUseCompressibleClusters     : 85067907
VolumeTotalCompressedClusters            : 49038358
VolumeTotalCompressionSavings            : 248231600128
VolumeCompressionInProgress              : False
```



当然，你也可以手动运行一次试试效果：

```powershell
Start-ReFSDedupJob `
  -Volume "G:" `
  -Duration 02:00:00 `
  -CpuPercentage 10 `
  -MinimumLastModifiedTimeHours 72 `
  -CompressionFormat ZSTD `
  -CompressionLevel 3
```



### NTFS

NTFS 是一种支持透明压缩的文件系统。为了维持长期兼容，NTFS 的核心磁盘格式演进相当克制[^5]。这使得 NTFS 尽管功能在不断更新，但都是由 `ntfs.sys` 文件系统驱动及其上层过滤驱动提供[^6]。也因此，压缩的算法只能使用 `Lempel-Ziv`[^7]，而不能使用新的高效算法，难以像新兴文件系统那样直接获得原生 CoW、reflink clone 或内建去重等能力[^8]。



本节将介绍几个外源工具，来间接实现压缩和去重功能。

* 也可以作用于其他文件系统，但 ReFS 自带的功能效率已足够高

如果你想对系统分区进行优化，可以直接参考 **[系统分区](#系统分区)** 一节。

#### 压缩

Windows 安装镜像长期能维持在数 GiB 规模，主要得益于 WIM/ESD 这类文件级镜像格式本身支持压缩与单实例存储：同一份文件资源只需保存一次，镜像导出时也可选择 `fast`、`max`、`recovery` 等不同压缩策略[^9][^10]。到了 Windows 10，微软进一步引入 Compact OS：系统文件不仅是“被压缩在安装镜像”，还支持透明解压，即以压缩状态，直接通过 FS IO 系统调用正常读取[^11]。

对应到用户侧，`compact.exe` 提供了统一入口。它原本就是 NTFS 压缩的命令行工具；在 Windows 10/11 中，还可以通过 `/CompactOS` 查询或切换系统压缩状态，并通过 `/EXE:XPRESS4K|XPRESS8K|XPRESS16K|LZX` 对文件使用面向可执行文件的压缩算法[^12]。这些文件在读取时由 Windows Overlay Filter（WOF）/ NTFS 路径按需解压，因此对普通应用通常表现为“透明读取”；但写入时可能触发回退为普通未压缩文件，不能把它理解为所有文件系统、所有写入场景下都无感透明[^13]。



如需启用 NTFS 自带的透明压缩，可以直接在磁盘属性中开启 **压缩此驱动器以节约空间**，然后你就可以获得 **数十至几百兆** 的空闲空间，聊胜于无~

![image-20260708170317052](https://static-a-moebako.a632079.me/20260708/faee69949007908ecf2c7b405c1d1033.avif)



这里我们着重讨论压缩率更高的方法——Compact OS `/EXE`：

* XPRESS4K —— 约 53% 压缩率，压缩速度最快

* XPRESS8K —— 约 49% 压缩率
* XPRESS16K —— 约 46% 压缩率
* LZX —— 约 38% 压缩率，压缩质量最好，也最慢

> `XPRESS` 后的数字（4K / 8K / 16K）是**压缩块大小**：块越大，压缩后体积越小（压缩比越高），但读取时需要整块解压、随机读越慢；`LZX` 块最大、压缩比最高、也最慢。开发场景一般 `XPRESS8K` / `XPRESS16K` 是速度与体积的不错平衡。



推荐使用这个项目进行可视化压缩管理：https://github.com/IridiumIO/CompactGUI

> 也可以直接通过 `compact.exe` 使用，但 CompactGUI 会自带目录监听功能，可以持续性的压缩以节省空间。

由于 `/EXE` 不支持卷目录压缩，所以可以通过添加多个目录的方式来使用：

![image-20260708170758274](https://static-a-moebako.a632079.me/20260708/db6d9a861b8208b7a94a1ed0896841d2.avif)



如图选择监听目录，然后点击 **压缩选中项**：
![image-20260708170939642](https://static-a-moebako.a632079.me/20260708/98389fe4cf474a4ad1752413908ee02d.avif)

![image-20260708171013161](https://static-a-moebako.a632079.me/20260708/8195207ab8dcbd0ce8b505118b7e30cf.avif)

耐心等待压缩完成，就可以获得近一半的空闲空间。


#### 去重

Windows Server 有一个非常好用的功能：[Windows Server Data Deduplication](https://learn.microsoft.com/en-us/windows-server/storage/data-deduplication/understand)，通过驱动注入过滤器，来实现透明读取；并支持定期去重功能。但这个功能在消费端 Windows 不可用。因此，我们只能找一个更通用的，针对文件的去重方法：**硬链接合并**。

* 通过扫描整个磁盘的文件，并计算 :ruby[哈希(Hash)] 来计算完全相同的文件，然后通过创建硬链接来使得多份文件只需要一份空间

> **动手前先理解硬链接**：硬链接不是「复制」也不是「快捷方式」，而是**同一份磁盘数据的多个文件名入口**。因此有三个必须记住的性质：
>
> 1. **原地修改任意一个，其余全部一起变**——所以硬链接去重只对「只读 / 写一次」的文件（编译产物、依赖包）安全；切勿对会被就地改写的文件做合并，否则会「殃及」所有副本；
> 2. **只有删掉最后一个入口，空间才真正释放**；
> 3. **不能跨卷**——`fclones` 只能在同一个盘符内合并，跨 `D:` / `E:` 会失败。
>
> 这也是 pnpm、Kache 都强调「内容不可变」的原因：正是为了规避第 1 点。

这里推荐使用一个 Rust 编写的小工具：https://github.com/pkolaczk/fclones

或是其 GUI 版本：https://github.com/pkolaczk/fclones-gui



可以很轻易的使用 Scoop 安装：
```shell
❯ scoop install fclones
Installing 'fclones' (0.35.0) [64bit] from 'extras' bucket
Starting download with aria2 ...
Download: Download Results:
Download: gid   |stat|avg speed  |path/URI
Download: ======+====+===========+=======================================================
Download: 0c0616|OK  |   5.7MiB/s|G:/scoop/cache/fclones#0.35.0#aa42bff.zip
Download: Status Legend:
Download: (OK):download completed.
Checking hash of fclones-0.35.0-windows-x86_64.zip ... ok.
Extracting fclones-0.35.0-windows-x86_64.zip ... done.
Linking G:\scoop\apps\fclones\current => G:\scoop\apps\fclones\0.35.0
Creating shim for 'fclones'.
'fclones' (0.35.0) was installed successfully!
```



> 为了保证能够彻底合并，下文所有指令的执行都假设你当前 Shell 拥有 **管理员权限**。
>
> 你可以开启 Windows 自带的 Sudo 工具：
>
> ![image-20260708191313076](https://static-a-moebako.a632079.me/20260708/35994d4ee5d31a4bbc39e8326ace5439.avif)
>
> 或是使用 [gsudo](https://github.com/gerardog/gsudo) 来实现 `sudo` 功能。

先进行一次扫描：

* 你可以通过 `fclones group --help` 查看其支持的参数

```
❯ fclones group --no-ignore --hidden "D:\" > F:\dupes.txt
[2026-07-08 18:43:40.363] fclones.exe:  info: Started grouping
[2026-07-08 18:46:00.120] fclones.exe: warn: 另一个程序正在使用此文件，进程无法访问。 (os error 32)
[2026-07-08 18:48:06.097] fclones.exe:  info: Scanned 874314 file entries
[2026-07-08 18:48:06.103] fclones.exe:  info: Found 758530 (1.3 TB) files matching selection criteria
[2026-07-08 18:48:06.483] fclones.exe:  info: Found 615535 (138.8 GB) candidates after grouping by size
[2026-07-08 18:48:06.577] fclones.exe:  info: Found 615535 (138.8 GB) candidates after grouping by paths
[2026-07-08 18:48:20.730] fclones.exe:  info: Found 147541 (29.7 GB) candidates after grouping by prefix
[2026-07-08 18:48:21.189] fclones.exe:  info: Found 146956 (29.1 GB) candidates after grouping by suffix
[2026-07-08 18:48:31.427] fclones.exe:  info: Found 145871 (28.0 GB) redundant files
```

它会生成一份人类可读的数据文件，可以进行简单审阅：

![image-20260708190405318](https://static-a-moebako.a632079.me/20260708/8b952184a21a14aecbff3a1623bf3b1d.png)

为了保险起见，在真正开始硬链接合并前，使用其 `--dry-run` 模式演练一遍：

```powershell
Get-Content F:\dupes.txt | fclones link --dry-run
```

当确认无误后，就可以开始实际合并了：

```powershell
Get-Content F:\dupes.txt | fclones link
```

当看到这行提示时，就说明合并完成了：

```shell
[2026-07-08 19:11:40.353] fclones.exe:  info: Processed 83738 files and reclaimed 15.9 GB space
```



#### 系统分区

针对 系统分区（通常是 C 盘），通常更推荐一个唾手可得的软件：

* https://github.com/Chuyu-Team/Dism-Multi-language

它内置的 CompactOS，硬链接合并功能都考虑到了系统分区的一些问题，做了针对性处理[^14][^15]。

解压完，启动，选中这两个项目：
![image-20260708184753808](https://static-a-moebako.a632079.me/20260708/8215b50f0a6de5f6f293ba6ea427fb9f.avif)



如果没有这两个选项的话，请开启专家模式：
![image-20260708184912942](https://static-a-moebako.a632079.me/20260708/8516489a94b996e7ea0a2c6fc052e415.avif)

![image-20260708184933393](https://static-a-moebako.a632079.me/20260708/d95dba39aa3cf4e431702bfdca133978.avif)

此外，也可以在这里调整压缩算法：

![image-20260708184954232](https://static-a-moebako.a632079.me/20260708/bc72d2c9e3d8dacd381f14a042022bed.png)



然后依次点击 **扫描**、**清理**，即可完成空间释放：
![image-20260708185025810](https://static-a-moebako.a632079.me/20260708/b96a7d037976ac9f6970a5d467e52651.avif)



## 应用

应用层能做的事也是上文提及的两点：**压缩**、**去重**。

譬如：

* `yarn@berry` 的 PnP 模式不再展开传统 `node_modules`，而是生成 `.pnp.cjs` loader；该 loader 记录依赖树与包在磁盘上的位置，并让 `require` / `import` 按这些位置解析。Yarn 的包缓存使用 zip，并通过 ZipFS / FakeFS 这类透明文件系统层支持从 zip 内读取包内容[^16]。
* `pnpm` 把包文件放入 [Content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage)，再把 `node_modules` 中的包文件硬链接到该 store；因此相同包、甚至不同版本中内容相同的文件，可以在多个项目之间共享磁盘占用[^17]。

**压缩**，需要使用方支持，比如说 [sqlite-zstd](https://github.com/phiresky/sqlite-zstd) 必须每个客户端都安装了，才能获得读取、写入的能力，亦或是直接 **修改、劫持** 运行时的 **IO 调用**——这意味着，这在大多数场景在是不可接受的。



所以，最有价值的，也最合理的方式是让编译产物、依赖通过硬链接共享。或是通过 PATH 共享。

* VC++ Runtime、Webview2：一种公共依赖，和应用解耦，避免重复空间占用
* 各种 :ruby[前沿(Advance)] 的包管理器：使用 **硬链接** 来减少占用



### Rust

Rust 大概是最受 **存储焦虑** 影响的语言之一。

Cargo Layout V1 的 **粗粒度结构设计** 导致持续增量构建，会出现缓存无法追踪，导致不能自动使缓存失效的问题——以至于 `target` 目录会持续膨胀：

* Cargo Build Dir Layout V2 的目标：把 build-dir 重组为更小、更自包含的构建单元，为细粒度锁、target GC、跨 workspace 缓存铺路：https://rust-lang.github.io/rust-project-goals/2025h2/cargo-build-dir-layout.html
* Build Dir Layout V2 测试公告：新布局从“按产物类型组织”改为“按 package + build unit 输入 hash 组织”：https://blog.rust-lang.org/2026/03/13/call-for-testing-build-dir-layout-v2/

而**重编译问题**又进一步放大了焦虑。很多不影响 public interface 的修改，例如改注释、调整 `use` 顺序、改私有实现，本不应该从依赖树上往下重编；但目前 Rust 会从该 `crate` 开始，重新编译它，以及所有依赖它的包，导致重复生成大量的构建产物。

* 通过 :ruby[重新链接(Relink)] 而不是 :ruby[重编译(Rebuild)] 提案：https://rust-lang.github.io/rust-project-goals/2025h2/relink-dont-rebuild.html
* 正在实施中的计划：https://github.com/rust-lang/rust/issues/158844



得益于 LLM 的流行，使得人人都可以并发开发多个分支。通过 `git worktree`，可以同时在多个目录上基于不同分支迭代。又由于上述的问题，会出现 `N × M` 规模的存储膨胀。



因此，在官方提案稳定化没有预期的背景下，必须寻求一个第三方工具来缓解这个问题。



#### Kache

Kache 是当前新推出的库。与 sccache 不同的是，它通过 [Content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) 来处理构建产物，使用 Blake3 计算 :ruby[哈希(Hash)]，相同输入会通过 CoW（ReFS），硬链接（NTFS）来将原始产物映射到 `target/` 下，从而避免重复编译，以及重复存储开销[^18]。

* https://github.com/kunobi-ninja/kache
* 官方的安装文档：https://kunobi.ninja/docs/kache/getting-started/installation

可以直接通过 `cargo binstall` 获取 `kache`：

```shell
❯ cargo binstall kache
 INFO resolve: Resolving package: 'kache@=0.9.0'
 WARN The package kache v0.9.0 (x86_64-pc-windows-msvc) has been downloaded from github.com
 INFO This will install the following binaries:
 INFO   - kache.exe (kache.exe -> G:\packages\cargo\bin\kache.exe)
Do you wish to continue? yes/[no]
? yes
 INFO Installing binaries...
 INFO Done in 17.464105s
```

初始化：

```powershell
kache init -y
```

> 请注意，如果你的 `CARGO_HOME` 不为 `$HOME` 目录的话，可能需要手动修改 `$CARGO_HOME/config.toml` 文件来接入 `kache`。
>
> 这是一个使用 `msedit` 修改配置的例子：
>
> ```powershell
> edit $env:CARGO_HOME/config.toml
> ```
>
> 然后添加：
>
> ```toml
> [build]
> rustc-wrapper = "kache"
> ```

如果一些正常的话，就可以在进行并行开发时，享受到更低的存储开销了。

可以通过 `kache status` 来查看当前状态：

```shell
❯ kache stats
Store:      11.9 GiB / 50.0 GiB (1872 entries, 24%)
Dedup:      5127 unique blobs, 11.9 GiB physical, 0.0% savings
Hit rate:   31.3% (local: 1103, prefetch: 0, remote: 0, dup: 0, miss: 2421)
Weighted:   23.8% by compile cost
Miss share: 96.7% of wrapper time (~2.1h)
Time saved: ~32min (estimated compile work avoided, last 24h)
Daemon:     v0.9.0 (epoch 1783513919)
Remote:     not configured

```

### 其他语言

#### Node.js

Node.js 之前也饱受膨胀问题的困扰，不过现在通过 `pnpm`[^17]、`bun`[^19]、`yarn`[^16]、`deno`[^20] 进行管理都可以缓解存储空间，文件深度问题的困扰。

#### Python

Python 也有类似的问题，随着 `uv` 的推出，很好的缓解了 `conda`、`poetry` 带来的存储开销[^21]，也解决了一些其未能解决的问题[^22]。



## 总结

洋洋洒洒也大几千字了。总之，在清理完缓存、无用的垃圾后，不管什么出于什么目的，想减少空间占用都是这两把斧：「压缩」、「去重」。

如图，笔者的开发卷（ReFS）在经过上述操作后，效果还是非常显著的。

![image-20260708202055716](https://static-a-moebako.a632079.me/20260708/33c80d6c8f4ea2d3c04cd40d4b7ea8ce.png)

## 参考

[^1]: 横向对比可参考 GPT5.5 收集的资料：https://chatgpt.com/share/6a4d3b5b-7f00-83ea-97b1-81a337419f12

[^2]: DevDrive「性能模式」仅 Microsoft Defender 支持异步扫描，第三方杀软需用 `fsutil devdrv setfiltersallowed` 手动管理允许的筛选器：https://learn.microsoft.com/en-us/windows/dev-drive/ ；Defender 性能模式（同步→异步扫描）说明：https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-antivirus-performance-mode

[^3]: 关闭 PowerShell 的管理模块以使 refsutil 指令生效：https://github.com/microsoft/devhome/issues/3584#issuecomment-2585651654

[^4]: PowerShell 的 ReFS 管理模块：https://learn.microsoft.com/en-us/powershell/module/microsoft.refsdedup.commands/?view=windowsserver2025-ps

[^5]: Windows XP 可以直接打开，修改，使用在 Windows 11 格式化，并进行深度使用的 NTFS 卷

[^6]: Microsoft 文档说明，Windows 的文件系统是作为 “file system drivers” 实现的，NTFS 属于系统提供的文件系统之一；另一个调试文档明确称 `ntfs.sys` 是让系统读写 NTFS 卷的驱动文件。旧 KB 310749 还提到，Windows NT 4.0 SP4 中更新的 `Ntfs.sys` 驱动使 NT 4.0 能读写 Windows XP 的 NTFS 卷，并说明 NTFS 3.0/3.1 具备兼容的磁盘格式。
    * https://learn.microsoft.com/en-us/windows-hardware/drivers/ifs/about-file-system-drivers
    * https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x24--ntfs-file-system
    * https://www.betaarchive.com/wiki/index.php/Microsoft_KB_Archive/310749

[^7]: Microsoft 对 NTFS 系统压缩的解释：https://learn.microsoft.com/en-us/windows/win32/fileio/file-compression-and-decompression

[^8]: 新特性仅针对 ReFS 引入：https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/d4bc551b-7aaf-4b4f-ba0e-3a75e7c528f0

[^9]: `/Append-Image` 说明：WIM 会比较已有资源并只保存唯一文件副本；同一 WIM 只能有一种压缩类型。https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism-image-management-command-line-options-s14

[^10]:  `/Export-Image` 说明：支持 `/Compress:{fast|max|none|recovery}`，其中 `recovery` 要求目标为 `.esd`，体积更小。https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism-image-management-command-line-options-s14

[^11]: Compact OS 允许 Windows 从压缩后的系统文件运行。https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/compact-os

[^12]: `compact` 用于显示或修改 NTFS 分区中文件/目录的压缩状态，并列出 `/EXE` 支持的 XPRESS 与 LZX 算法。https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/compact

[^13]: WOF 会在打开读取时按需解压；若以写入方式打开，文件可能回退为普通文件。https://devblogs.microsoft.com/oldnewthing/20190618-00/?p=102597

[^14]: CompactOS 仅作用于系统文件：https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/compact

[^15]: 硬链接合并屏蔽 WindowsApps目录，以免某些程序无法启动：https://github.com/Chuyu-Team/Dism-Multi-language/blob/master/UpdateHistory.md

[^16]: Yarn 官方文档说明，PnP 会生成 `.pnp.cjs` Node.js loader，用它记录依赖树、包在磁盘上的位置，并解析 `require` / `import`；同时 Yarn PnP loader 会直接引用 cache path，而 Yarn 的 cache 文件已改为 zip，选择 zip 的原因之一是其随机访问性能优于 tgz。参见： [Yarn: Plug'n'Play](https://yarnpkg.com/features/pnp)、[Yarn Changelog: cache files are now zip instead of tgz](https://yarnpkg.com/advanced/changelog)

[^17]: 参见： [pnpm Motivation: Saving disk space](https://pnpm.io/motivation)、[pnpm: Symlinked `node_modules` structure](https://pnpm.io/symlinked-node-modules-structure)

[^18]: GPT5.5 —— Sccache 对比 Kache：https://chatgpt.com/share/6a4e4298-2bdc-83ea-bed0-d2639afb8f18

[^19]: Bun 的 `bun install` 将下载的包存入全局缓存（`~/.bun/install/cache`）；安装到项目 `node_modules` 时，默认在 Linux/Windows 以 **硬链接**、在 macOS 以 `clonefile`（写时复制）落地，使同一包版本在多个项目间共享物理存储（可用 `--backend` 调整）。https://bun.sh/docs/pm/global-cache

[^20]: Deno 默认将 `npm:`、`jsr:` 与远程模块统一缓存于全局目录（`DENO_DIR`）；在没有 `package.json` 时不生成本地 `node_modules`，从而跨项目共享依赖、规避深层目录问题（行为可经 `nodeModulesDir` 配置）。https://docs.deno.com/runtime/packages/

[^21]: uv 维护一个全局的、内容寻址（content-addressed）的缓存以对依赖去重；将包安装进虚拟环境时按 `link-mode` 落地——默认在 macOS/Linux 为 `clone`（写时复制）、Windows 为 `hardlink`，故同一包版本仅存一份（要求缓存与环境位于同一文件系统，否则回退为拷贝）。
    * https://docs.astral.sh/uv/concepts/cache/
    * https://docs.astral.sh/uv/reference/settings/

[^22]: uv 以 Rust 实现，安装与依赖解析较 pip / Poetry 快约一到两个数量级，并提供跨平台的「通用解析」（universal resolution），产出可移植的 `uv.lock`；同时以单一二进制取代 pip、pip-tools、pipx、poetry、pyenv、virtualenv 等碎片化工具链——这些正是 Poetry 与 Conda 在纯 Python 工作流下未能兼顾之处。
    * https://docs.astral.sh/uv/
    * https://docs.astral.sh/uv/concepts/resolution/
