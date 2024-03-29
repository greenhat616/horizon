---
title: 为什么我要使用 1Password（密码管理软件）？
date: 2023-01-03T19:09:47+08:00
tags: ["技术", "密码管理器", "信息安全"]
featured_image: https://cdn.a632079.me/assets/images/202212061646348.png
description: 其实笔者很早就用起了密码管理软件，其实，我相信你们大多数也使用过这类工具。此文旨在介绍密码管理器使用的必由性，以及为何从中挑选了 1Password 作为笔者的选择。
categories: 技术分享
---

# 为什么我要使用 <ruby>1Password<rp>（</rp><rt>一种密码管理软件</rt><rp>）</rp></ruby>？



其实笔者很早就用起了密码管理软件，其实，笔者相信你们大多数也使用过这类工具。~~哈哈，没有？~~ 如果你正在使用 Chrome、Edge、Firefox 或者其他浏览器[^1]自带的保存密码功能的话，其实也就是在使用这类工具了。

{{<row>}}

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="https://cdn.a632079.me/163music.html?playlist=1992034569" style="margin:0"></iframe>

{{</row>}}

## 缘起

### 引子

最早，在没有密码管理器的时代时，我还小，我和身边的大人一样——一个密码走天下。密码通常是简单的年份、生日、姓名、字符的排列组合，这个地方可能多加个 `&` 啊，那边可能改一下顺序之列的，盗号、木马似乎离我们很远……

后来，Chrome 登场了，慢慢撕裂了 Opera、Firefox、<ruby>I E<rt>Internet Explorer</rt></ruby> 、基于 `Webkit` 内核的三方浏览器的统治市场，我也随着潮流迁移至了 Chrome。那时候还没有“记住密码”这个功能，直到到他有之后，我也只是把他当作一个辅助填充密码的工具。

那，一切是什么时候转变的呢？

### 缘由

#### 站方密码泄漏风险

每月，都有很多厂商因为黑客入侵，或者员工自己的疏忽导致客户的用户信息遭到泄漏，当然，其中也包含 **密码**。

![image-20230117172702262](https://cdn.a632079.me/assets/images/202301171727705.png)

![image-20230117172831950](https://cdn.a632079.me/assets/images/202301171728043.png)

通常，这些密码管理软件都会从一些数据泄漏通告网站[^2]，来提醒你修改密码以确保你账户的安全。

#### 明文密码风险

一些钓鱼网站，或者不关注用户隐私问题的站点，通常会采用最简单的纯文本明文存储的方式来保存你的密码。笔者曾经接触过很多这样的软件，以及经手过的一些外包方，甚至一些开源项目，数据库后台都是使用的明文密码。

![image-20230103140622218](https://cdn.a632079.me/assets/images/202301031406315.png)

通常这类哈批开发商的找回密码逻辑真的就是给你发送你忘记掉的密码，但是这只是建立在开发商、运营商是哈皮的前提上。如果他们思维正常点，完全可以暴露一套正常的逻辑让你无法区分。

**你的密码暴露在安全之下……**

一旦泄漏，如果你的密码是和我之前一样只是进行随机改变的话，很容易就会被盗号者推测出你可能使用的规则，进而逆推。



#### 变换规则的成本过大

诚然，最安全的永远是 **离线的**、**不可重复读取的**、**具有复杂规则** 的，保存在人脑是目前来说最安全的选择之一。

我相信大多数人和笔者一样，智力也就正常水平，没那个能力设计多套算法用于记忆不同站点的密码规则[^3]，来确保安全性。

**因此，直接采用随机密码，来针对泄漏问题，未尝不是一个下位替代。**



## 密码管理器能做些什么？

狭义上密码管理器就是用来存储密码的记事本，用来替代纸质密码本的电子上位品。但随着用户需求的改变，他新增了很多非常实用的功能。以下所罗列的功能都是 1Password 所支持的功能，其他管理器不一定支持。

### 随机密码工具

多种规则，可自定义的长度，非常便捷的密码填充工具。我也经常用这个生成项目使用的 <ruby>盐<rp>（</rp><rt>Salt</rt><rp>）</rp></ruby>[^4] 以及 随机<ruby>标识<rt>I D</rt></ruby>。

<img src="https://cdn.a632079.me/assets/images/202301171740259.png" alt="image-20230117174004858" style="zoom:70%;" />

### 密码分类

我们可以给不同的站点做一个标记，甚至是为不同的项目做一些标记。

![image-20230117194503233](https://cdn.a632079.me/assets/images/202301171945625.png)

### 更多的密码笔记类型支持

我们可以为不同的需求添加不同的<ruby>密码笔记<rt>Security Note</rt></ruby>，比如说软件授权、数据库连接信息，他有相对应的模板和分类来辅助你存储此类信息。

![image-20230117194547572](https://cdn.a632079.me/assets/images/202301171945588.png)

### <ruby>瞭望塔<rp>（</rp><rt>WatchTower</rt><rp>）</rp></ruby>

瞭望塔即上文提到的 **密码安全检查** 功能，能够及时为你报告你的密码是否复用，是否遭到泄漏。

![image-20230117194713585](https://cdn.a632079.me/assets/images/202301171947505.png)

### <ruby>双因素 <rp>（</rp><rt>2 Fa</rt><rp>）</rp></ruby>认证 支持

![image-20230117194810320](https://cdn.a632079.me/assets/images/202301171948364.png)

不少的密码管理器软件都支持给网站添加双因素验证器的支持，但是一般我不建议在关键站点中仍然使用密码管理器。最好使用手机上的软件，或者安全令牌[^5]里的双因素认证器来完成关键网站的双因素认证。

## 那它有什么缺陷么？

有，缺陷还不少。

### 安全性的下降

便捷性的提升是建立在安全性的下降上的，在电子产品上尤其是这样。引入密码管理器软件，会使你的风险链条多了个：**密码管理器的存储媒介遭到入侵，或加密方式被破解，所有明文或加密的密码遭到泄漏**。

因此，为了缓解这个问题，我们通常会选择具有**多重因素加密的**，设计上合理的，没有丑闻的，久经历史考验的密码管理工具软件。

> 笔者认为 **离线部署** 是个具有争议的能够改善密码泄漏风险的因素。诚然，离线部署可以将网络攻击的风险降低，但是会让黑客的可攻击面变广——大多数人都不是个安全专家，优秀的运维，对吧？
>
> 因此，相应的，这些额外的风险将会由个人自担：
>
> * **系统层面的漏洞的风险**：普通人通常不会给系统打安全补丁，甚至有大聪明可能还直接把更新程序给关闭了。因此系统套件（<ruby>内核<rt>Kernel</rt></ruby>，<ruby>安全套件<rt>OpenSSL</rt></ruby>）的漏洞可以成为入侵的入口。
> * **服务器上其他软件的安全风险**：个人服务器通常会部署多个软件，很少有人会只部署一个专门的密码管理器服务器。因此其他软件引入的漏洞风险不容小觑。



### 输入便捷性的下降

由于密码不再是由你的长期记忆保存，因此输入密码前必须解锁你的密码管理软件，然后才能让他辅助填充密码。这可能会带来额外的几十秒开销，当然习惯之后就不是难事了。



## 密码管理工具的选取

笔者选择密码管理工具主要侧重于：

* 安全性相对来说高不高，是不是只有一个密码进行认证？
* 支持怎样的存储方式？离线，还是在线？
* 多设备协同的便捷性怎么样？
  * 支持全平台嘛？
  * 是否有独立的 Windows、Linux 客户端？
* 软件实现是否有什么缺陷？有没有泄漏过的历史？

笔者使用过 现代浏览器的密码保存功能[^6]、KeePass、Bitwarden、LastPass 等密码管理工具，以下罗列其优点，以及我不选择的理由。

### 现代浏览器的密码保存功能

浏览器同步的最大优势就是 **简单**、**免费**、**快捷**、**全平台支持**。

但他存在一个**致命的安全问题**[^7]：浏览器在 Windows 平台上使用 Windows 的凭据管理器 API 来加密密码，但是解密的密钥是 **明文存储** 在磁盘上的，任何进程无需管理员权限<sup>有争议 </sup>，即可 **自由读取**，完成解密你保存的所有密码。

这 **通常意味着**：如果你本地的杀毒软件的第一防线失守了（没有尝试拦截恶意软件读取你的浏览器目录），那么你的密码就会遭到最严重的：明文泄漏风险。

其次，浏览器程序没有便捷的客户端，查询密码比较不方便。

综上，我与我身边的朋友，基本不采用此方案。

### KeePass

这软件我用的时间比较少，它只支持自建的同步方案（包含网盘），它最符合人们对于狭义的密码管理软件的需求，三方功能需要插件协同。

他的优点：**开源**，**完全离线**，**可定制化能力高**。

我之所以放弃它也正是因为其配置成本太高——UI 简陋（大多数开源产品的通病），基础功能少（官方实现的客户端简陋），不太完善的跨平台支持（移动平台基本都是三方的软件<sup>安全风险?</sup>），同步体验一般。

### LastPass

LastPass 是我最开始使用的密码管理工具，也算是最老牌的。

~~抛开优点不谈，毕竟谁会要泄漏频繁的公司嘛……~~

**它最大的问题：**隔段时间都会泄露一次数据[^8]，虽然说他的数据使用你的密码加密的，但是……心里膈应不是么 :sweat:



### BitWarden

它的优势非常明显，有官方的同步、高级服务，官方的客户端，服务端也都是 **开源的**。也可以使用**三方**，**开源**，**自部署**，**基于 Rust**，**白嫖高级功能** 的版本：[VaultWarden](https://github.com/dani-garcia/vaultwarden) （早期曾叫做 `bitwarden-rs`）

![image-20230117195009308](https://cdn.a632079.me/assets/images/202301171950584.png)

它几乎是最完美的密码管理器了，如果你肯折腾点，勤于维护自己的安全服务器，亦或者你愿意付一笔极低价格的月租来享受一份不错的服务的话，那他将是你的最佳选择。

最终我也是在它 和 1Password 之间对比选择，最终我选择 1Password 的理由仅仅只是在客户端体验上，我觉得这也是它唯一的缺点了——客户端不太美观，以及填充，使用体验不太完美。

### Enpass

Enpass 我觉得算是 keePass 的上位替代品（懒癌的）吧。他也是无服务器的，需要通过存储软件，如 Google Drive、OneDrive、iCloud 来同步你的加密密码档案的，目前也提供了完善的全平台支持。

![image-20230117195044794](https://cdn.a632079.me/assets/images/202301171950920.png)

这软件由于定价比较贵，我的钱包承担不起（年租、一次性付费目前定价都比较贵），我没有体验很久，因此只把此缺陷列在此处。



### 1Password

> **注：** 1Password 8 在桌面端换成了 Electron + Rust <ruby>后端<rt>backend</rt></ruby> 的组合，因此风格，和交互在 Windows 和 Linux 的体验都得到了提升。
>
> 1Password 7 支持 **离线密码桶**，以及 **原生 UI** 的。在此时代，1Password 的 <ruby>Slogan<rt>标志</rt></ruby> 通常是：Apple 全家桶体验最佳的密码管理器软件~

1Password 相比 Bitwarden、EnPass，目前最大的优势就是支持一个额外的 Secret Key 的因素来加密密码，这个自动生成的定长长密钥需要自己妥善保管，在新登录设备登录时需要使用，大大提高了安全性。

![image-20230117195131083](https://cdn.a632079.me/assets/images/202301171951370.png)

其次，便是跨端，风格统一，操作便捷性好 :ok_hand: 了吧。

此外，它目前正完善 [开发者工具集成](https://1password.com/developers/)，在做目前 安全令牌[^5] 正做的事情。

也是恰逢巧合，让我选择了此款工具，上面罗列的[功能](#密码管理器能做些什么)，以及其 UI 正好戳中了我的爽点因此就愉快得耍了起来~ ~~又水了一文呢~~



## 一些安全提示

* 抛开密码管理器外，重要的网站务必启用 **双因素认证**，不管是邮箱、手机，还是说基于双因素认证器的；
* 常用的网站的密码需要定期修改，以保证安全性；
  * 一般说，像我这样的懒癌患者，只有在分享账户之后才会修改
* 电脑设备定期更新安全补丁，启用 **安全软件**；
  * 笔者使用的是 **卡巴斯基安全软件（KIS）**
  * 如果使用 Microsoft Defender，请务必启用安全规则[^9]
  * 如果你不会耍火绒的自定义规则的话，请不要使用火绒——它自带的防毒能力很弱的
* 经常关注 **瞭望塔** 的信息，及时修改密码；
* 如果自己的规则密码泄漏的话，请及时更换个新的规则，然后把之前的所有规则密码替换掉（最好是随机密码，下次不用这么烦了，只给密码管理器用新的规则密码）

## 后记

* 准备继续研究 yubikey 的玩法，目前买了个还没有仔细研究，心得留待以后更新~
* 后期如果不使用 1Password 的话，我可能会换回 BitWarden 或者 EnPass
* 留待补充，今天打字累了，之后再完善吧~



##  引用 & 注解

[^1]: 其他浏览器通常指的是 Safari、以及基于 Chromium 以及 IE 双核的国产魔改浏览器
[^2]: 数据泄漏通告网站有很多，比如 1Password 所采用的 <https://haveibeenpwned.com/>
[^3]: v2ex 社区在探讨密码管理的问题时，常有很多大牛分享自己的规则心得，其中不乏有难度达到心算 base64 的 （夸张手法）:smile:
[^4]: *盐，在密码学中，是指在散列之前将散列内容的任意固定位置插入特定的字符串。* 引自 [维基百科](https://zh.wikipedia.org/zh-cn/%E7%9B%90_(%E5%AF%86%E7%A0%81%E5%AD%A6))
[^5]: 安全令牌，在此处指的硬件安全认证器，如：Yubikey
[^6]: 现代浏览器的密码保存功能指的是 Chrome、Firefox 后来更新之后支持密码生成，以及密码泄漏风险分析的版本
[^7]: 其实早在 2014、2015 年就有这个问题的争端了，只是部分人不了解。这是 2022 年在 v2ex 社区的一个讨论：<https://www.v2ex.com/t/872745>
[^8]: 近期的 LastPass 泄漏事件的讨论：[发现 LastPass 是个坑 - V2EX](https://v2ex.com/t/875964)
[^9]: 如果不了解的话，请参考我的上篇文章：[最近勒索病毒频发，大家注意防护哦 - 藤之青 (a632079.me)](https://i.a632079.me/posts/antivirus-suggestion/)
