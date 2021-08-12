---
title: 使用 MacType 改善 Windows 字体渲染
slug: mactype-improve-windows-font-render
lastmod: '2018-05-25T21:25:37+08:00'
date: 2018-05-25T21:25:37+08:00
tags: ['mactype', '字体渲染', 'windows']
categories: 技术分享
featured_image: https://imgcdn.a632079.me/uploads/2018/05/BushHyrax_ZH_CN9145408965_1920x1080.jpg
toc: true
---
 
Windows 10 在高分辨屏幕下 (如 4k) 开启 200% 左右的缩放， 可以发现字体渲染十分的赞。 尽管比不上 MacOS ，但也可以说是十分出色了。 但是， 穷人（比如说我） 使用着 1080 P 屏幕升级至 Windows， 开启 120% 缩放后， 尽管渲染略有改善，但依旧不堪入目。 所以就上网搜刮了一圈， 果然发现了好东西————Mactype。

## 什么是 MacType?
开始之前，先简单的介绍一下 MacType，MacType 是由 FlyingSnow 延续 GDI++ 开源专案的字体渲染软体，直白的说就是替 Windows 的使用者在网页浏览、系统界面、一般程式中呈现更好看的字体显示效果。  

诚如前面提到 MacType 是延续 GDI++ 开源专案而来，局限当然就是只能渲染 GDI+ 的程序。所以对 Windows 7 之后，采用微软开发的新字体渲染引擎 DirectWrite 方案的程序像是微软自己的 UWP APP、Office 系列程式一直没有直接的解决办法，最大众化的差异就体现在 Chrome 52 版拿掉禁止 DirectWrite 功能后，呈现出一片模糊的效果。（幸好在 Firefox 上不是问题）  

令人雀跃的是，现在可以透过第后面提到的第三方开发 patch 拥有初步的解决方案。  

所以在这篇方法下，MacType 能帮我们做到的事情包括 **渲染 Windows 中使用 GDI+ 引擎显示** 的软件，以及在不修改系统的情况下 **快速更替使用的系统字体** 、让 DirectWrite 的 Grid-fitting 功能不执行 **避免中文字笔划被省略、改变** 。

## 安装 MacType
原开发作者 FlyingSnow 在 2013 年后沉默了 3 年。 于 2016 年 8 月 30 日， 连续 **更新了 4 个版本**, 这次更新不仅整合了~~しらいと（silight-jp）的代码~~（只整合到 1.13，后续要自己下载 patch 修正），启用了对 DirectWrite 的支援（甚至 gamma 值可调），并支持各个版本的 Metro 类程序，以及和 Windows 10 的兼容性。到 2018 年 5 月 26 日时， 最新的版本为: 1.2017.628.0.  

要获取 MacType， 首先需要访问 FlyingSnow 的 Github 仓库: [https://github.com/snowie2000/mactype](https://github.com/snowie2000/mactype).
找到 `Release` 按钮， 然后找到最新的版本点击下载安装。
这里提供写文时， 最新的发行版下载地址: [https://github.com/snowie2000/mactype/releases/download/v1.2017.628.0/MacTypeInstaller_2017_0628_0.exe](https://github.com/snowie2000/mactype/releases/download/v1.2017.628.0/MacTypeInstaller_2017_0628_0.exe)

## 整合 しらいと（silight-jp） 补丁
しらいと（slight_jp）在他的「MacTypeでDirectWriteの设定を変えるパッチ」中更进一步的提供了可以修改 Windows 10 DirectWrite 设定的能力，使用他 patch 的方法是：
1. 从[他的发布页](https://silight.hatenablog.jp/entry/MacTypePatch)下载最新的 MacTypePatch（现在最新版本是 1.26）
2. 解压缩后将文件夹内的 EasyHK32.dll、EasyHK64.dll 档案复制到 MacType 的安装文件夹中
3. 将「win8.1 or later」资料夹内的 UserParams.ini 档案，同样丢到 MacType 的安装文件夹
4. 如果 Windows 10 是 32-bit 的话：
  * 将 EasyHK32.dll 也复制到「C:\Windows\System32\」文件夹内；
5. 如果 Windows 10 是 64-bit 的话：
  * 将 EasyHK32.dll 丢到「C:\Windows\SysWOW64\」文件夹内，
  * 并且将 EasyHK64.dll 丢到「C:\Windows\System32\」文件夹内。
  * （这边看仔细，我并没有写错）

使用这个方法除了原本使用 GDI 渲染字体的部份会依照原来的设定档渲染，采用 DirectWrite 的渲染字体的设定档也会依照 UserParams.ini 渲染，此外当然也可以透过修改这个档案自己调整 DirectWrite 渲染方式。

也就是说用这个方法能够渲染阉割掉「关闭 DirectWrite 功能」的 Chrome 52 及之后版本的浏览页面，需要注意的是这个方法只支持「注册表加载模式」以及「服务加载模式」。

## 使 Firefox 支持渲染 （可选）
在完成好 MacType 安装、整合 しらいと（silight-jp） 补丁后，接下来就是最后 Firefox 设定的部份了：

1. 在 Firefox 网址栏， 输入 about:config，进入修改 prefs.js 档页面
2. 在搜索框中，输入 `gfx.direct2d.disabled`，修改此值为 `true`。
3. 不想停掉硬体加速，在 Firefox 52 之后版本要多一个步骤，在搜索中输入 `gfx.content.azure.backend`s，把偏好从 `direct2d1.1,skia,cairo` 改为`direct2d1.1,cairo,skia`，或著直接删掉 `skia`。
4. 关闭重开 Firefox，这样应该就可以看到渲染的结果了。

有人问上面第二步骤为什么要把 `gfx.direct2d.disabled` 改成 `true`，那是因为一般启用硬体加速后（在工具 > 选项 > 进阶里），MacType 渲染会失效，而透过此方法可以在不失去图层加速的情况下让 MacType 渲染字体。

## 选择 MacType 适用的配置
选择喜欢的 MacType 配置， 启用之后就可以享受带 MacType 带来的享受了。
可以到 MacType 的[贴吧](http://tieba.baidu.com/f?ie=utf-8&kw=mactype), 寻找钟意的配置。

> 以上内容大部分参考 [如何在 Windows 10 中使用 MacType](https://kreen.org/1892/how-to-use-mactype-on-windows-10).
> 咱曾经在 2013 年就使用了一段时间的 MacType（也许还能在贴吧中找到我的踪迹呢~）， 但之后 DW 推行之后就不再使用了。