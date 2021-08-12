---
title: 喵！送上 Aplayer 和 Cplayer 网易云音乐的支持。
tags: ["163music", "aplayer", "cplayer"]
slug: 163music
lastmod: '2018-02-20T17:12:30+08:00'
date: 2017-08-21T07:40:32+08:00
categories: 技术分享
featured_image: https://piccdn.freejishu.com/images/2016/04/08/c6ca8bedce31b9314cc5ff97ab5a9f66.jpg
---

### 起因
网易云自带的播放器并不支持 `Https`,而且功能有些落后了:( Aplayer本身是有个 Python 项目的...但最近挂掉了..所以只能自己动手了.

### 原理
**服务端** ~~使用 Node.js 的 [网易云API](https://github.com/Binaryify/NeteaseCloudMusicApi) 搭建服务~~ 目前采用自建的 [teng-koa](https://github.com/a632079/teng-koa)  
**页面** 使用 XMLhttpRequest请求结果,并交给播放器
优点: 只要 Github 项目不炸...API网易没改...那么就可以一直使用.(哪怕我的炸了，你也可以自己搭个)

### Demo

##### Aplayer

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="https://cdn.a632079.me/163music.html?playlist=28391862" style="margin:0"></iframe>

```HTML
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="https://cdn.a632079.me/163music.html?playlist=28391862"></iframe>
```

#### Cplayer

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="108" src="https://cdn.a632079.me/163cplayer.html?playlist=438803182"  style="margin:0"></iframe>

```HTML
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="108" src="https://cdn.a632079.me/163cplayer.html?playlist=438803182"></iframe>
```

### 更多设置？
请参考 [Aplayer](https://github.com/MoePlayer/Aplayer) 和 [Cplayer](https://github.com/MoePlayer/cPlayer) 的 Github 文档(除了Playlist不可变更外，你都可以通过向URL加参数来配置播放器)
