---
title: '小记: 迁移至 Hexo'
date: 2018-02-15 22:52:46
tags: ["技术", "搬迁", "Hexo"]
featured_image: https://imgcdn.a632079.me/uploads/2017/08/1319288,106.jpg
description: 偷懒、节流是人类进步的源动力，鉴于静态博客能部署到 Pages 服务上，博主尝试前一到了 Hexo。
---

今年是 2018， 狗年， 新的一年。 咱博客自上线至今已经有 3 年， 期间使用过 WordPress, Z-Blog, Emlog, Typecho, Ghost。但总是觉得太过繁重， 毕竟个人博客嘛。  
没必要搞得那么繁重 （~~竟然还需要数据库？ 竟然还需要动态编译？~~） 毕竟身为 Geeker, 不容许有这些瑕疵。 所以简单便捷， 接口清楚明了， 支持静态编译的 Hexo 便成了不二之选。

# 从 Ghost 迁移至 Hexo
由于原来的博客是使用 Ghost 驱动的， 当时使用 Ghost 便是被他的默认主题所惊艳。 很可惜， 在 Ghost v1 中 casper 变得丑陋不堪。 最重要的事, 目前开发的项目全部要求 Node.js Engine >= 8.0. 而 Ghost v0.x 并不支持 Node.js v8.x。 哎， 于是痛下决心， 迁移至了 Hexo.

> 本文将简单介绍如何从 Ghost 迁移至 Hexo。

## 安装环境
嗯嗯嗯， 环境是运行的基础。 由于我通常使用 `Ubuntu 16.04` 作为日常开发环境， 所以以下内容完全基于 ubuntu 哦~

### Node.js
首先呢， 安装 Node.js. 虽然我更想推荐 fibjs 的 (逃

```shell
$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt install -y nodejs
```
### Yarn
然后呢，安装 Node.js 中一流好用的包管理器 ———— Yarn 啦。 当然 pnpm 也是不二之选， 但是 Link 方式多多少少可能存在些问题所以咱们就不推荐了。

```shell
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt install -y yarn
```

### 检查下是否安装成功
```
$ node -v
$ yarn -v
```
大概会打印类似下面的内容:
```
$ node -v
v8.11.2

$ yarn -v
1.7.0
```
### 初始化 Hexo

首先呢， 安装 Hexo-cli
```
$ sudo yarn global add hexo-cli
```
初始化~
```
$ hexo init blog # 可以修改为其他目录名
```

### 导入你的 Ghost 数据
在此之前， 我们需要安装 `hexo-migrator-ghost`。
```
$ cd blog # 先进入之前我们创建的博客
$ yarn && yarn add hexo-migrator-ghost
```

然后， 我们从自己的 Ghost 中导出数据文件。
这是导出可能存在的位置: `http://yourblog.com/ghost/debug/`

之后， 我们只需要执行 `hexo migrate ghost` 就能导入进来了~ 

剩下的就是 Hexo 的玩法了， 我就不多啰嗦了。祝玩耍愉快， 干杯~
