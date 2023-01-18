---
title: "Navicat 16 激活攻略"
authorLink: https://i.a632079.me
slug: navicat-16-keygen
lastmod: 2023-01-18T03:04:35.182Z
date: 2023-01-18T03:04:35.182Z
categories: 技术分享
tags: ["转载", "Navicat 16", "cracker", "keygen", "patcher"]
featured_image: https://cdn.a632079.me/assets/images/202301172017258.png
description: 由于众所周知的原因，Navicat 16 更新后很难找到合适的破解，此前有 tgMrz 大佬改的 GUI 激活工具，在最新的版本中也已经失效了，本文将 转载 Doublesine 巨佬的激活工具的使用方式，以及原理说明。
---

# Navicat 16 激活攻略

> 由于众所周知的原因，Navicat 16 更新后很难找到合适的破解，此前有 **tgMrz** 大佬改的 GUI 激活工具，在最新的版本中也已经失效了，本文将 ***转载*** **Doublesine** 巨佬的激活工具的使用方式，以及原理说明。
>
> 仓库地址：<https://notabug.org/doublesine/navicat-keygen/>
>
> ***请注意：本工具只用于学习交流的目的，禁止商业使用，请自觉在下载 24 小时后删除。如有侵权，请联系博主。***

##  序

本教程是以 **Windows** OS 为背景提供的 二进制编译文件 以及 使用说明。

* 如果您使用的是基于 **Linux <ruby>内 核<rt>Kernel</rt></ruby>** 的操作系统：那么想必您拥有一定的动手能力，该项目也提供了 Linux 版本的支持。
  * <ruby>克隆<rt>Clone</rt></ruby> 仓库的 Linux 分支：<https://notabug.org/doublesine/navicat-keygen>
  * 按仓库的教程食用：<https://notabug.org/doublesine/navicat-keygen/src/linux/doc/how-to-use.zh-CN.md>

* 如果您使用的是 **MacOS**，那么很遗憾，此项目尚未更新对 MacOS 最新版本的支持
  * 您可以尝试从 macw 等商店获取成品软件

## 工具下载

大佬的仓库中没有提供编译后的 **二进制** 文件，需要自行编译。

在此，笔者提供一份自己机器上编译的版本（附杀毒报告）。*如果您有能力，更建议自行编译。*

### 下载方式

笔者采用 Mega 网盘转储：<https://mega.nz/file/2rYFCKrA#2NCxrBhWugOtlBwIfww5WgMXxTnwtPmYQ_8CYEO1aqM>

以下是 <ruby>哈希<rt>Hash</rt></ruby> 验证信息：

```
md5: b9068cc5bab2e2d30e374f3d8d10c639
sha1: 6fc40177eec88861c100a4ddef26ef55db68862d
sha256: 62c74467e0aa9ef7809a49a3c55182707b8c5c54739cce9999c3d2cac9ecf031
sha512: 5555f69a87b07f742a508eb1bc7f5947db4806d620898707d422c66e797316e4006756ef75c424159d4c0ca6f2a666d6dda6d20ca15ac273a2d44c32f61267d9
```

### 杀毒报告

![image-20230117204406043](https://cdn.a632079.me/assets/images/202301172044377.png)

> VirusTotal 杀毒报告：[https://www.virustotal.com/gui/file/62c74467e0aa9ef7809a49a3c55182707b8c5c54739cce9999c3d2cac9ecf031/detection](https://www.virustotal.com/gui/file/62c74467e0aa9ef7809a49a3c55182707b8c5c54739cce9999c3d2cac9ecf031/detection)

## 使用说明

使用过之前 GUI 版本的激活工具的童鞋们，应该会发现破解一般分两步走：破解软体、注册机激活。此工具也是如此。

### 第一步、破解软体

使用 `navicat-patcher.exe` 替换掉 `navicat.exe` 和 `libcc.dll` 里的 Navicat 激活公钥。

#### 使用参数

```shell
navicat-patcher.exe [-dry-run] <Navicat Install Path> [RSA-2048 PEM File Path]
```

- `[-dry-run]` 运行 patcher 但不对 Navicat 程序做任何修改。

  * **这个参数是可选的。**

- `<Navicat Install Path>` Navicat 的完整安装路径。
  * **这个参数必须指定。**
  
- `[RSA-2048 PEM File Path]` RSA-2048 私钥文件的完整路径或相对路径。
  * **这个参数是可选的。** 
  * 如果未指定，`navicat-patcher.exe` 将会在当前目录生成一个新的 RSA-2048 私钥文件。

#### 具体例子

假设，我们的 `Navicat Premium` 安装在：`D:\Program Files\PremiumSoft\Navicat Premium 16`，我们需要在一个 **具有管理员权限的 Shell** 中执行：

```shell
 navicat-patcher.exe "D:\Program Files\PremiumSoft\Navicat Premium 16"
```

![image-20230118094618231](https://cdn.a632079.me/assets/images/202301180946582.png)

看到如下输出，那么说明程序成功破解：

```
***************************************************
*       navicat-patcher by @DoubleLabyrinth       *
*               version: 16.0.7.0-2               *
***************************************************

[+] Try to open libcc.dll ... OK!

[*] patch_solution_since<16, 0, 7, 0>: m_va_CSRegistrationInfoFetcher_WIN_vtable = 0x0000000183bcb5c8
[*] patch_solution_since<16, 0, 7, 0>: m_va_CSRegistrationInfoFetcher_WIN_GenerateRegistrationKey = 0x00000001815165b0
[*] patch_solution_since<16, 0, 7, 0>: m_va_iat_entry_malloc = 0x0000000183995bb8
[+] patch_solution_since<16, 0, 7, 0>: official encoded key is found.

[*] Generating new RSA private key, it may take a long time...
[*] Your RSA private key:
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAmdHCwOyS5kf3m39ztrnqdUawFRFlSnILS0N8lXCNxblNqwwB
kst/4v4FR4aFzUBZDag4S4z3RzLIFyUzvgACtxI1tXZAacIDElUbPmOcCyXS/xWe
8sc0mjUazRkH8J+XOtFpm9wnoVex7kpDocOH/Xpet/HOCJNF1RbsssfpyA2V4PIG
Etx4FseVNnkdzua29RzL/UCzRqy1LtdWd8xA25HhmkNbTX8YIQbYLinTQxah9q6d
x5TBYHLdXMxh6JT+xrdRxLMSqqgTvTNFUhtaP1nziJ+dmTMj6ufbsgBiKMF2ziO7
gJzKvPsQ1Fu1fkEjPJKVHgjD84EQQevgTtZCLQIDAQABAoIBABQwywIc65lrp+5S
2AMLu2Fignl5e5S+jIn4FVHeYNWr4ayKmmhE6wgGNPYzC7wp7qaSxrTwD4NagJY9
LWIKyVBzhPZJS+I188ZDwpw5YgG6mMwf7+nJSTfWsaprVzX4FNdFJrotN0x/4Ny5
BdClhGO63NUDWfqZLkjuxeofwKmgHrd4aknxzKBjh/p4Y7x0qZ4F07flPAiZPvgp
XOJhzkOX3ayj8crZa1jo1XEYlMnj9BhPrU1wEzH0LnaS0bey3/KiiMLwBAovBGY5
xxZ0lWX57VJ33U52MepCJJX+S5Y+L8BNRVkRPmNJioI5uBXITuZ97OHjikOwr1A8
CoRwBecCgYEAu6HzUIXOJNo+VVlOtXJXbuDlVX0ZDJKdTl0a37hPa8D4o+BI174H
yg9tanALEgBRn/5rXDE4fE4jQ7TRHerhfsrSZpML38clarfQ8UujTDaYYPsxv5tm
Uy0mgS74kjwd5goT86n5RfO7LBQv811PYs+H3Tc6cm6vCTjmdl22r4MCgYEA0d3E
4VDDE/Lkr/NLlSNlZNXYCL5aJ2pD0dl6fLyzFA/HBF3ApmJj2gtYN3rGeplzIHbz
4tjJI22owpEiG2ZFVBq1wQ5s4xl2HUvY/zh9B2VuIoODkWmOfUEb3ptoEIthCjY7
B9McDtnjCY3qm2mWts4PiwQXRH4U4Whblnn/aI8CgYBh+NI/fV6CR6K8lgFPJQEa
WDvnQ4bM1dFllZ/uqSJvNTee+gGPBR60FxIevZpKL/hu/j24ycqgvXwUYlm+sWJE
/kqWXLmagzW6X3iuRbxiky9FlGQJlG79h1nPomMQmGtULnb0iBAswnM9NN1Eybgl
9A8RJ0FRdxHWUuujapN1WQKBgQDJLBKcAXTeXIlG+KtNLP72594Mk5uMCNs1/4jg
pWnsIyudTdlsJQiebR2FIRW9U/b9+cjTfQdiBK4uxDyzkxeGBYyQoSlTkIaekqRS
Em4Xdu1Z/ENUUqEaBB2ZB9N7eH/u8Akp+P3+ZnKyJ+3qSA8G8QQJOEStjUaqxAR3
fD6OlQKBgBLSPBuzW1I8TVF+CiG0DPtGVGIJzPBwY5aUucAI6whVudg21JtI1i0x
XfsjlvNnHc4F22/e1JLW/7iXhRIkCMzywjhsYNE4446a/Rruq9gPkxShGURQXsf5
feaRJlOnmBn6QPSu5Uz+Ydo2lN0+wf9bRBCoBkhD8jut7Acv8nW+
-----END RSA PRIVATE KEY-----

[*] Previous backup D:\Program Files\PremiumSoft\Navicat Premium 16\libcc.dll.bak is detected. Delete? (y/n)y
[*] patch_solution_since<16, 0, 7, 0>: Patch has been done.
[*] New RSA-2048 private key has been saved to
    D:\Programs\C\navicat-keygen\bin\x64-Release\RegPrivateKey.pem


*******************************************************
*           PATCH HAS BEEN DONE SUCCESSFULLY!         *
*                  HAVE FUN AND ENJOY~                *
*******************************************************
```



### 第二步、注册激活

> 首先，我们需要 **断开网络连接**，否则我们无法进入离线激活模式。

使用 `navicat-keygen.exe` 来生成序列号和激活码。

#### 使用参数

- `<-bin|-text>` 必须是 `-bin` 或 `-text`：

  * 如果指定了 `-bin`，`navicat-keygen.exe` 最终将生成 `license_file` 文件。这个选项是给 Navicat  旧激活方式使用的。

  * 如果指定了 `-text`，`navicat-keygen.exe ` 最终将生成 *Base64* 样式 的激活码。这个选项是给 Navicat 新激活方式使用的。

  * **这个参数必须指定。**

- `[-adv]` 开启高级模式：

  * **这个参数是可选的。** 
  * 如果指定了这个参数，`navicat-keygen.exe` 将会要求你手工填写产品 ID 号、语言标识号。这个选项一般是给以后用的。

- `<RSA-2048 Private Key File>` RSA-2048 私钥文件的完整路径或相对路径。私钥必须是 PEM 格式的。

  * **这个参数必须指定**
  * 通常，这里指定上一步生成的私钥文件位置

#### 具体例子

在 Shell 中执行：

```shell
.\navicat-keygen.exe -text "./RegPrivateKey.pem"
```

按照提示，输入内容即可。以下是一个输出示例：

![image-20230118100851620](https://cdn.a632079.me/assets/images/202301181008836.png)

```
***************************************************
*       navicat-keygen by @DoubleLabyrinth        *
*                version: 16.0.7.0-2              *
***************************************************

[*] Select Navicat product:
 0. DataModeler
 1. Premium
 2. MySQL
 3. PostgreSQL
 4. Oracle
 5. SQLServer
 6. SQLite
 7. MariaDB
 8. MongoDB
 9. ReportViewer
 10. ChartsCreator
 11. ChartsViewer

(Input index)> 1

[*] Select product language:
 0. English
 1. Simplified Chinese
 2. Traditional Chinese
 3. Japanese
 4. Polish
 5. Spanish
 6. French
 7. German
 8. Korean
 9. Russian
 10. Portuguese

(Input index)> 1

[*] Input major version number:
(range: 1 ~ 16, default: 16)>

[*] Serial number:
NAVG-JP3K-5UHA-MTH7

[*] Your name: a632079
[*] Your organization: MoeTeam

[*] Input request code in Base64: (Input empty line to end)
i6Y1s/zSH+4H6RdsArBnlKJ0VTw3G4xgltlkNhfqgl2NgixF4D+Md6hHhaFsasExrLJROSi8Uasod0sHeIDtTdKvi9PauoWeBU4Awkk40tBjNXIT7WCzrcz0/ICjqh/93V2pvLuNYvxs2VokzjjtMeZaIq69YcphMPvEzH9XfuMM5X6MOSwBhrXidBPRe4ZrKpymLJmRFOrahYM7ePjW18YTt6eGotv7vQyVjAM4Fkcguq7Fs5sFEAoxiRZDfeJbCIm00Nu/EnExrH7KHiNAgfRYSxMfqeNMYTjXdg/xRceHSh3J8NHtS2H/C3TylGfP7F/EQY0/LQ5VomUGljmvEQ==

[*] Request Info:
{"K":"NAVGJP3K5UHAMTH7", "DI":"F13AE162D04FFD18753D", "P":"WIN"}

[*] Response Info:
{"K":"NAVGJP3K5UHAMTH7","DI":"F13AE162D04FFD18753D","N":"a632079","O":"MoeTeam","T":1674007528}

[*] Activation Code:
ap633yJNVSetY7DBTESwI+6FCO+7MEYXlZDxMD4FiOCFxFNFCYtwu3+ID5W2Je+pk2dbUWBre+FNi+p4nRnfxt+qnOHC6hVMehQnVmSh7mlqz7zgzEnVFSOPOswdnBtbJG2thX46qLwSmFnGYVWbEVuCTGCKPq3ndxd1/4x+5+hoIMtUKR7kJqX320j97yPuD1ZkexXktY9xbrrfQdc4PnuBrmOoBGS0EVi/K0S3VhAXYqKH2OWO+DU8CG03Y0B6P95D19ryrykg895haLtVMxOs9FwWj+MxHScRbukG1XWNgzT4zeTzfPvE27ESrIY+tL/39bc4bydmCdcqULiSEA==
```

#### 激活流程刨解

如果你不熟悉英文的话，可以按以下的关键点输入数据。

1. 选择激活软体

```
[*] Select Navicat product:
 0. DataModeler
 1. Premium
 2. MySQL
 3. PostgreSQL
 4. Oracle
 5. SQLServer
 6. SQLite
 7. MariaDB
 8. MongoDB
 9. ReportViewer
 10. ChartsCreator
 11. ChartsViewer
 
 (Input index)>
```

此处，我们需要激活 `Navicat Premium`，因此输入 `1` 并按下 <kbd>Enter</kbd> 。

2. 选择软体语言

```
[*] Select product language:
 0. English
 1. Simplified Chinese
 2. Traditional Chinese
 3. Japanese
 4. Polish
 5. Spanish
 6. French
 7. German
 8. Korean
 9. Russian
 10. Portuguese

(Input index)>
```

此处，我们使用的版本为 `简体中文` 版，因此输入 `1` 并按下 <kbd>Enter</kbd>。

3. 选择软件版本

```
[*] Input major version number:
(range: 1 ~ 16, default: 16)>
```

此处，我们激活的版本为 `16.1.6`，因此直接按下 <kbd>Enter</kbd>。

4. 获取序列号。

```
[*] Serial number:
NAVG-JP3K-5UHA-MTH7
```

此处，输出的为我们激活的序列号。

**先断网**，打开 Navicat，进入激活页面，输入许可证并点击激活后出现这个页面：（选择 **手动激活**）

![image-20230118100451671](https://cdn.a632079.me/assets/images/202301181018292.png)

5. 配置注册身份信息：

```
[*] Your name: a632079
[*] Your organization: MoeTeam
```

此处，我们假设用户为 `a632079`，组织为 `MoeTeam`。

输入 `a632079` 按下 <kbd>Enter</kbd>，再输入 `MoeTeam` 按下 <kbd>Enter</kbd>。

6. 生成激活码

```
[*] Input request code in Base64: (Input empty line to end)
```

看到如上字符，然后我们去如下界面复制请求码：

![image-20230118100501940](https://cdn.a632079.me/assets/images/202301181024795.png)

复制进终端后，按下两次 <kbd>Enter</kbd>。

```
[*] Input request code in Base64: (Input empty line to end)
i6Y1s/zSH+4H6RdsArBnlKJ0VTw3G4xgltlkNhfqgl2NgixF4D+Md6hHhaFsasExrLJROSi8Uasod0sHeIDtTdKvi9PauoWeBU4Awkk40tBjNXIT7WCzrcz0/ICjqh/93V2pvLuNYvxs2VokzjjtMeZaIq69YcphMPvEzH9XfuMM5X6MOSwBhrXidBPRe4ZrKpymLJmRFOrahYM7ePjW18YTt6eGotv7vQyVjAM4Fkcguq7Fs5sFEAoxiRZDfeJbCIm00Nu/EnExrH7KHiNAgfRYSxMfqeNMYTjXdg/xRceHSh3J8NHtS2H/C3TylGfP7F/EQY0/LQ5VomUGljmvEQ==

```



7. 激活程序

看到程序吐出如下内容：

```
[*] Activation Code:
ap633yJNVSetY7DBTESwI+6FCO+7MEYXlZDxMD4FiOCFxFNFCYtwu3+ID5W2Je+pk2dbUWBre+FNi+p4nRnfxt+qnOHC6hVMehQnVmSh7mlqz7zgzEnVFSOPOswdnBtbJG2thX46qLwSmFnGYVWbEVuCTGCKPq3ndxd1/4x+5+hoIMtUKR7kJqX320j97yPuD1ZkexXktY9xbrrfQdc4PnuBrmOoBGS0EVi/K0S3VhAXYqKH2OWO+DU8CG03Y0B6P95D19ryrykg895haLtVMxOs9FwWj+MxHScRbukG1XWNgzT4zeTzfPvE27ESrIY+tL/39bc4bydmCdcqULiSEA==
```

第二行即是我们需要的 **激活码**，我们将其复制进激活页面，点击激活，即激活成功。**此时恢复网络连接即可。**

![image-20230118100540495](https://cdn.a632079.me/assets/images/202301181024266.png)

![image-20230118100604804](https://cdn.a632079.me/assets/images/202301181024018.png)



## 原理分析

> 原文来自：<https://notabug.org/doublesine/navicat-keygen/src/windows/doc/how-does-it-work.zh-CN.md>
>
> 博主只对本篇内容进行内容整理，并优化显示格式。

### 关键词解释

- **Navicat激活公钥**

这是一个 2048 位的RSA公钥，Navicat 使用这个公钥来完成相关激活信息的加密和解密。

这个公钥被作为 **RCData** 类型的资源储存在 **navicat.exe** 当中。资源名为 `"ACTIVATIONPUBKEY"`。你可以使用一个叫 [Resource Hacker](http://www.angusj.com/resourcehacker/) 的软件来查看它。这个公钥的具体内容为：

```
  -----BEGIN PUBLIC KEY-----  
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw1dqF3SkCaAAmMzs889I  
  qdW9M2dIdh3jG9yPcmLnmJiGpBF4E9VHSMGe8oPAy2kJDmdNt4BcEygvssEfginv  
  a5t5jm352UAoDosUJkTXGQhpAWMF4fBmBpO3EedG62rOsqMBgmSdAyxCSPBRJIOF  
  R0QgZFbRnU0frj34fiVmgYiLuZSAmIbs8ZxiHPdp1oD4tUpvsFci4QJtYNjNnGU2  
  WPH6rvChGl1IRKrxMtqLielsvajUjyrgOC6NmymYMvZNER3htFEtL1eQbCyTfDmt  
  YyQ1Wt4Ot12lxf0wVIR5mcGN7XCXJRHOFHSf1gzXWabRSvmt1nrl7sW6cjxljuuQ  
  awIDAQAB  
  -----END PUBLIC KEY-----  
```

如果您有相应的私钥并乐意公开的话欢迎联系我，我将非常感谢您的慷慨。

**注意：**

从 **Navicat Premium 12.0.25** 开始，Navicat 不再从 `navicat.exe` 的资源中加载私钥。事实上，公钥转为从 `libcc.dll` 中加载，并且已经被加密。与此同时，为了防止被轻松地替换，加密的公钥被分到5个地方储存：

以下内容是从 **Navicat Premium x64 12.0.25 简体中文版** 的 `libcc.dll` 中发现的，`libcc.dll` 的SHA256值为 `607e0a84c75966b00f3d12fa833e91d159e4f51ac51b6ba66f98d0c3cbefdce0`。我不保证在Navicat 的其他版本中相关偏移量和下述的相同，但相关的 **字符串** 以及 **立即数** 是很可能找得到的。

1. 在 `libcc.dll` 中，文件偏移量 `+0x01A12090` 的地方，储存了加密公钥的第一部分，以 **字符串** 的形式储存：

   ```
    "D75125B70767B94145B47C1CB3C0755E  
     7CCB8825C5DCE0C58ACF944E08280140  
     9A02472FAFFD1CD77864BB821AE36766  
     FEEDE6A24F12662954168BFA314BD950  
     32B9D82445355ED7BC0B880887D650F5" 
   ```

2. 在 `libcc.dll` 中，文件偏移量 `+0x0059D799` 的地方，储存了加密公钥的第二部分，以 **立即数** 的形式储存在一条指令中：

   ```
    0xFE 0xEA 0xBC 0x01
   ```

   相应的十进制值为： `29158142`

3. 在 `libcc.dll` 中，文件偏移量 `+0x01A11DA0` 的地方，储存了加密公钥的第三部分，以 **字符串** 的形式储存：

   ```
    "E1CED09B9C2186BF71A70C0FE2F1E0AE  
     F3BD6B75277AAB20DFAF3D110F75912B  
     FB63AC50EC4C48689D1502715243A79F  
     39FF2DE2BF15CE438FF885745ED54573  
     850E8A9F40EE2FF505EB7476F95ADB78  
     3B28CA374FAC4632892AB82FB3BF4715  
     FCFE6E82D03731FC3762B6AAC3DF1C3B  
     C646FE9CD3C62663A97EE72DB932A301  
     312B4A7633100C8CC357262C39A2B3A6  
     4B224F5276D5EDBDF0804DC3AC4B8351  
     62BB1969EAEBADC43D2511D6E0239287  
     81B167A48273B953378D3D2080CC0677  
     7E8A2364F0234B81064C5C739A8DA28D  
     C5889072BF37685CBC94C2D31D0179AD  
     86D8E3AA8090D4F0B281BE37E0143746  
     E6049CCC06899401264FA471C016A96C  
     79815B55BBC26B43052609D9D175FBCD  
     E455392F10E51EC162F51CF732E6BB39  
     1F56BBFD8D957DF3D4C55B71CEFD54B1  
     9C16D458757373E698D7E693A8FC3981  
     5A8BF03BA05EA8C8778D38F9873D62B4  
     460F41ACF997C30E7C3AF025FA171B5F  
     5AD4D6B15E95C27F6B35AD61875E5505  
     449B4E"
   ```

4. 在 `libcc.dll` 中，文件偏移量 `+0x0059D77F` 的地方，储存了加密公钥的第四部分，以 **立即数** 的形式储存在一条指令中：

   ```
     0x59 0x08 0x01 0x00
   ```

   相应的十进制值为： `67673`

5. 在 `libcc.dll` 中，文件偏移量 `+0x01A11D8C` 的地方，储存了加密公钥的第五部分，以 **字符串** 的形式储存：

   ```
     "92933"
   ```

这五部分按照 `"%s%d%s%d%s"` 的形式输出则为加密的公钥，顺序和上述的顺序相同，具体的输出为：

```
  D75125B70767B94145B47C1CB3C0755E7CCB8825C5DCE0C58ACF944E082801409A02472FAFFD1CD77864BB821AE36766FEEDE6A24F12662954168BFA314BD95032B9D82445355ED7BC0B880887D650F529158142E1CED09B9C2186BF71A70C0FE2F1E0AEF3BD6B75277AAB20DFAF3D110F75912BFB63AC50EC4C48689D1502715243A79F39FF2DE2BF15CE438FF885745ED54573850E8A9F40EE2FF505EB7476F95ADB783B28CA374FAC4632892AB82FB3BF4715FCFE6E82D03731FC3762B6AAC3DF1C3BC646FE9CD3C62663A97EE72DB932A301312B4A7633100C8CC357262C39A2B3A64B224F5276D5EDBDF0804DC3AC4B835162BB1969EAEBADC43D2511D6E023928781B167A48273B953378D3D2080CC06777E8A2364F0234B81064C5C739A8DA28DC5889072BF37685CBC94C2D31D0179AD86D8E3AA8090D4F0B281BE37E0143746E6049CCC06899401264FA471C016A96C79815B55BBC26B43052609D9D175FBCDE455392F10E51EC162F51CF732E6BB391F56BBFD8D957DF3D4C55B71CEFD54B19C16D458757373E698D7E693A8FC39815A8BF03BA05EA8C8778D38F9873D62B4460F41ACF997C30E7C3AF025FA171B5F5AD4D6B15E95C27F6B35AD61875E5505449B4E6767392933
```

这个加密的公钥可以用我的另外一个 repo（[how-does-navicat-encrypt-password](https://github.com/DoubleLabyrinth/how-does-navicat-encrypt-password)）解密，其中密钥为 `b'23970790'`。

例如：

```cmd
  E:\GitHub>git clone https://github.com/DoubleLabyrinth/how-does-navicat-encrypt-password.git
  ...
  E:\GitHub>cd how-does-navicat-encrypt-password\python3
  E:\GitHub\how-does-navicat-encrypt-password\python3>python
  Python 3.6.3 (v3.6.3:2c5fed8, Oct  3 2017, 18:11:49) [MSC v.1900 64 bit (AMD64)] on win32
  Type "help", "copyright", "credits" or "license" for more information.
  >>> from NavicatCrypto import *
  >>> cipher = Navicat11Crypto(b'23970790')
  >>> print(cipher.DecryptString('D75125B70767B94145B47C1CB3C0755E7CCB8825C5DCE0C58ACF944E082801409A02472FAFFD1CD77864BB821AE36766FEEDE6A24F12662954168BFA314BD95032B9D82445355ED7BC0B880887D650F529158142E1CED09B9C2186BF71A70C0FE2F1E0AEF3BD6B75277AAB20DFAF3D110F75912BFB63AC50EC4C48689D1502715243A79F39FF2DE2BF15CE438FF885745ED54573850E8A9F40EE2FF505EB7476F95ADB783B28CA374FAC4632892AB82FB3BF4715FCFE6E82D03731FC3762B6AAC3DF1C3BC646FE9CD3C62663A97EE72DB932A301312B4A7633100C8CC357262C39A2B3A64B224F5276D5EDBDF0804DC3AC4B835162BB1969EAEBADC43D2511D6E023928781B167A48273B953378D3D2080CC06777E8A2364F0234B81064C5C739A8DA28DC5889072BF37685CBC94C2D31D0179AD86D8E3AA8090D4F0B281BE37E0143746E6049CCC06899401264FA471C016A96C79815B55BBC26B43052609D9D175FBCDE455392F10E51EC162F51CF732E6BB391F56BBFD8D957DF3D4C55B71CEFD54B19C16D458757373E698D7E693A8FC39815A8BF03BA05EA8C8778D38F9873D62B4460F41ACF997C30E7C3AF025FA171B5F5AD4D6B15E95C27F6B35AD61875E5505449B4E6767392933'))
  -----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw1dqF3SkCaAAmMzs889I
  qdW9M2dIdh3jG9yPcmLnmJiGpBF4E9VHSMGe8oPAy2kJDmdNt4BcEygvssEfginv
  a5t5jm352UAoDosUJkTXGQhpAWMF4fBmBpO3EedG62rOsqMBgmSdAyxCSPBRJIOF
  R0QgZFbRnU0frj34fiVmgYiLuZSAmIbs8ZxiHPdp1oD4tUpvsFci4QJtYNjNnGU2
  WPH6rvChGl1IRKrxMtqLielsvajUjyrgOC6NmymYMvZNER3htFEtL1eQbCyTfDmt
  YyQ1Wt4Ot12lxf0wVIR5mcGN7XCXJRHOFHSf1gzXWabRSvmt1nrl7sW6cjxljuuQ
  awIDAQAB
  -----END PUBLIC KEY-----
```

**注意：**

从 **Navicat Premium 12.1.11** 开始，Navicat 不再用上面说的方法加载密钥。当然密钥还是储存在 `libcc.dll` 文件中。当 Navicat 启动时，它会用 8 字节长的 XOR 密钥来加密公钥，并储存到一个静态数据区中。当验证 **激活码** 时，Navicat 会重新生成一样的 8 字节 XOR 密钥，并解密在静态储存区中的密文，从而获取公钥。

在 `libcc.dll`，x64 版本中，你会看到如下的几条指令：

```asm
  xor eax, 'M'
  mov byte_xxxxxx, al
  ...
  xor eax, 'I'
  mov byte_xxxxxx, al
  ...
  xor eax, 'I'
  mov byte_xxxxxx, al
  ...
  xor eax, 'B'
  mov byte_xxxxxx, al
  ...
  xor eax, 'I'
  mov byte_xxxxxx, al
  ...
  xor eax, 'j'
  mov byte_xxxxxx, al
  ...
  ...
```

- **请求码**

这是一个 Base64 编码的字符串，代表的是长度为 256 字节的数据。这 256 字节的数据是 **离线激活信息** 用 **Navicat激活公钥** 加密的密文。

- **离线激活请求信息**

这是一个JSON风格的字符串。它包含了 3 个Key：`"K"`、`"DI"`和`"P"`，分别代表 **序列号**、**设备识别码**（与你的电脑硬件信息相关）和 **平台** (其实就是操作系统类型)。

例如：

```
  {"K": "xxxxxxxxxxxxxxxx", "DI": "yyyyyyyyyyyyy", "P": "WIN8"}
```

- **激活码**

这是一个 Base64 编码的字符串，代表的是长度为256字节的数据。这256字节的数据是 **离线激活回复信息** 用 **Navicat 激活私钥** 加密的密文。目前我们不知道官方的 **Navicat 激活私钥**，所以我们得替换掉软件里的公钥。

- **离线激活回复信息**

和 **离线激活请求信息** 一样，它也是一个JSON风格的字符串。但是它包含5个Key，分别为`"K"`、`"N"`、`"O"`、`"T"` 和 `"DI"`.

`"K"` 和 `"DI"` 的意义与 **离线激活请求信息** 中的相同，且Value必须与 **离线激活请求信息** 中的相同。

`"N"`、`"O"`、`"T"` 分别代表 **注册名**、**组织**、**授权时间**。

**注册名** 和 **组织** 的值类型为 UTF-8 编码的字符串。**授权时间** 的值类型可以为字符串或整数（感谢 [@Wizr](https://notabug.org/Wizr) 在issue [#10](https://notabug.org/doublesine/navicat-keygen/issues/10)中的报告）。

```
`"T"` 可以被省略。
```

- **序列号**

这是一个被分为了 4 个部分的字符串，其中每个部分都是4个字符长。

**序列号** 是通过 10 个字节的数据来生成的。为了表达方便，我用 **uint8_t data[10]** 来表示这 10 个字节。

1. **data[0]** 和 **data[1]** 必须分别为 `0x68` 和 `0x2A`。

   这两个字节为 Navicat 的标志数。

2. **data[2]**、**data[3]** 和 **data[4]** 可以是任意字节，你想设成什么都行。

3. **data[5]** 和 **data[6]** 是 Navicat 的语言标志，值如下：

|  语言类型   |  data[5]  |  data[6]  |  发现者         |
|------------|:---------:|:---------:|-----------------|
|  English   |  `0xAC`   |  `0x88`   |                 |
|  简体中文   |  `0xCE`   |  `0x32`   |                 |
|  繁體中文   |  `0xAA`   |  `0x99`   |                 |
|  日本語     |  `0xAD`   |  `0x82`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |
|  Polski    |  `0xBB`   |  `0x55`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |
|  Español   |  `0xAE`   |  `0x10`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |
|  Français  |  `0xFA`   |  `0x20`   |  [@Deltafox79](https://notabug.org/Deltafox79)    |
|  Deutsch   |  `0xB1`   |  `0x60`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |
|  한국어     |  `0xB5`   |  `0x60`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |
|  Русский   |  `0xEE`   |  `0x16`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |
|  Português |  `0xCD`   |  `0x49`   |  [@dragonflylee](https://notabug.org/dragonflylee)  |

4. **data[7]** 是 Navicat 产品 ID。（感谢 [@dragonflylee](https://notabug.org/dragonflylee) 和 [@Deltafox79](https://notabug.org/Deltafox79)提供的数据）

|产品名                 |Enterprise|Standard|Educational|Essentials|
|----------------------|:--------:|:------:|:---------:|:--------:|
|Navicat Report Viewer |`0x0B`      |        |           |          |
|Navicat Premium       |`0x65`      |        |`0x66`       |`0x67`      |
|Navicat MySQL         |`0x68`      |`0x69`    |`0x6A`       |`0x6B`      |
|Navicat PostgreSQL    |`0x6C`      |`0x6D`    |`0x6E`       |`0x6F`      |
|Navicat Oracle        |`0x70`      |`0x71`    |`0x72`       |`0x73`      |
|Navicat SQL Server    |`0x74`      |`0x75`    |`0x76`       |`0x77`      |
|Navicat SQLite        |`0x78`      |`0x79`    |`0x7A`       |`0x7B`      |
|Navicat MariaDB       |`0x7C`      |`0x7D`    |`0x7E`       |`0x7F`      |
|Navicat MongoDB       |`0x80`      |`0x81`    |`0x82`       |          |


5. **data[8]** 的高 4 位代表 **版本号**。低 4 位未知，但可以用来延长激活期限，可取的值有 `0000` 和 `0001`。

   例如：

   对于 **Navicat 12**: 高 4 位必须是 `1100`，为 `12` 的二进制形式。
    对于 **Navicat 11**: 高 4 位必须是 `1011`，为 `11` 的二进制形式。

6. **data[9]** 目前暂未知，但如果你想要 **not-for-resale license** 的话可以设成 `0xFD`、`0xFC` 或 `0xFB`。

   根据 **Navicat 12 for Mac x64** 版本残留的符号信息可知：

   - `0xFB` 是 **Not-For-Resale-30-days** license.
   - `0xFC` 是 **Not-For-Resale-90-days** license.
   - `0xFD `是 **Not-For-Resale-365-days** license.
   - `0xFE` 是 **Not-For-Resale** license.
   - `0xFF` 是 **Site** license.

之后 Navicat 使用 **ECB** 模式的 **DES** 算法来加密 **data[10]** 的后8字节，也就是 **data[2]** 到 **data[9]** 的部分。

相应的 DES 密钥为：

```cpp
  unsigned char DESKey = { 0x64, 0xAD, 0xF3, 0x2F, 0xAE, 0xF2, 0x1A, 0x27 };
```

之后使用 Base32 编码 **data[10]**，其中编码表改为：

```cpp
  char EncodeTable[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
```

编码之后你应该会得到一个 16 字节长的字符串，并且以 `"NAV"` 打头。

将 16 字节的字符串分成 4 个 4 字节的小块，然后用 `"-"` 连接就可以得到 **序列号**。

### 激活过程

1. 检查用户输入的 **序列号** 是否合法。

2. 在用户点击了`激活`按钮之后，Navicat 会先尝试在线激活。如果失败，用户可以选择离线激活。

3. Navicat 会使用用户输入的 **序列号** 以及从用户电脑收集来的信息生成 **离线激活请求信息**，然后用 **Navicat 激活公钥** 加密，并将密文用 Base64 编码，最后得到 **请求码**。

4. 正常流程下，**请求码** 应该通过可联网的电脑发送给 Navicat 的官方激活服务器。之后 Navicat 的官方激活服务器会返回一个合法的 **激活码**。

   但现在我们使用注册机来扮演官方激活服务器的角色，只是 Navicat 软件里的激活公钥得换成自己的公钥：

   1. 根据 **请求码**, 获得`"DI"`值和`"K"`值。
   2. 用`"K"`值、用户名、组织名和`"DI"`值填写 **离线激活回复信息**。
   3. 用自己的 2048 位RSA私钥加密 **离线激活回复信息**，你将会得到256字节的密文。
   4. 用 Base64 编码这256字节的密文，就可以得到 **激活码**。
   5. 在 Navicat 软件中填入 **激活码** 即可完成离线激活。
