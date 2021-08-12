---
title: 怎样安装Ghost呢？
tags: ["技术", "教程", "ghost"]
slug: how-to-install-ghost
lastmod: '2017-08-23T11:44:42+08:00'
date: 2017-01-17T18:29:50+08:00
categores: 技术分享
featured_image: https://imgcdn.a632079.me/uploads/2017/08/427988,106.jpg
---

> **Before All :**
> 目前 Ghost 已发布 v1.x , 以下内容仅针对 v0.x 。
> 如果您更喜欢 v0.x (LTS) 的风格，可以根据下面的内容进行尝试 :D

-------------

> 最近在学习Guillermo Rauch的《了不起的Node.js:将JavaScript进行到底》这一本书，便萌生了更换博客系统为Ghost的想法，于是一番折腾，终于搞定了。

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="106" src="https://cdn.a632079.me/163cplayer.html?playlist=410801521"></iframe>

### 1.准备

> **必须：一台 VPS 或者 一个支持 Node.js 的容器**

#### 1.1 安装nodejs环境

Ghost 推荐使用nodejs LTS V6
我们就以Node.js V6来驱动Ghost吧。首先，使用SSH链接到你的VPS，选取合适的位置执行以下命令：

```shell
wget https://npm.taobao.org/mirrors/node/v6.9.4/node-v6.9.4.tar.gz #获得nodejs源代码
tar -xzf node-v6.9.4.tar.gz #解压源代码
cd node-v6.9.4
./configure #配置
make #编译
make install #安装
```

经过漫长的等待，Node.js 就算是安装成功了。但NPM源由于在国外，在国内链接十分不稳定。我们再执行一下 `npm config set registry http://registry.npm.taobao.org/` 来把NPM源替换为淘宝源。

#### 1.2获取Ghost源代码

Ghost 目前官网不再提供下载，它的源代码目前托管在 GitHub 上。首先，我们需要找一个合适的位置，先创建个文件夹：
`mkdir ghost #ghost可以替换成你喜欢的名字`
然后，我们进入这个文件夹，获取Ghost的源代码。

```shell
cd ghost
wget https://github.com/TryGhost/Ghost/releases/download/0.11.4/Ghost-0.11.4.zip #下载Ghost
unzip Ghost-0.11.4.zip #解压压缩包
rm Ghost-0.11.4.zip #删除源代码压缩包
```

### 2.安装

好了，Ghost 已经成功获取到了。这时候我们在 Ghost 目录下执行下 `npm install --production`，完成对Ghost依赖包的获取。
测试：执行 `npm start`，然后用浏览器访问 **你的ip:2368**，如果页面正常显示，那么初级安装操作就完成了。

### 3.使Ghost后台驻存

#### 3.1使用forever

你可以使用 `forever` 以后台任务运行 Ghost 。`forever` 将会按照 Ghost 的配置，若进程 Crash 会重启 Ghost。

* 通过 `npm install forever -g` 安装 forever
* 为了让 `forever` 从 Ghost 安装目录运行，输入 `NODE_ENV=production forever start index.js`
* 通过 `forever stop index.js` 停止 Ghost
* 通过 `forever list` 检查 Ghost 当前是否正在运行

#### 使用supervisor

流行的 Linux 发行版——例如 Fedora， Debian 和 Ubuntu，都包含一个 Supervisor 包：一个进程控制系统，允许在启动的时候无需初始化脚本就能运行 Ghost。不像初始化脚本一样，Supervisor 可以移植到不同的发行版和版本。

* 根据不同的 Linux 发行版 安装 Supervisor 。如下所示：
  * Debian/Ubuntu： `apt-get install supervisor`
  * Fedora： `yum install supervisor`
  * 其他大多数发行版： `easy_install supervisor`
* 通过 `service supervisor start` 确保 Supervisor 运行  
* 为 Ghost 创建一个启动脚本。通常为 `/etc/supervisor/conf.d/ghost.conf` ，例如：

```conf
[program:ghost]
command = node /path/to/ghost/index.js
directory = /path/to/ghost
user = ghost
autostart = true
autorestart = true
stdout_logfile = /var/log/supervisor/ghost.log
stderr_logfile = /var/log/supervisor/ghost_err.log
environment = NODE_ENV="production"
```

* 使用 Supervisor 启动 Ghost：`supervisorctl start ghost`

* 停止 Ghost： `supervisorctl stop ghost`

详细内容请参阅 Supervisor 文档。

#### 3.1脚本初始化（本站所用的方法）

Linux 系统在启动的时候会运行初始化脚本。这些脚本通常存在于 `/etc/init.d` 。为了让 Ghost 一直运行下去甚至自动重启，你可以设置一个初始化脚本来完成这个任务。
**以下的例子工作在 Ubuntu ，并且在 Ubuntu 12.04 下测试通过。**

* 使用以下命令创建 `/etc/init.d/ghost` 文件：

```bash
sudo curl https://raw.githubusercontent.com/TryGhost/Ghost-Config/master/init.d/ghost \ -o /etc/init.d/ghost
```

* 使用 `nano /etc/init.d/ghost` 命令打开文件并检查以下内容：
  * 将 `GHOST_ROOT` 变量的值更换为你的 Ghost 安装路径
  * 检查 `DAEMON` 变量的值是否和 `which node` 的输出值相同
  * 这个初始化脚本将在你的系统上以它自己的 Ghost 用户和用户组运行，使用以下命令来创建：

```bash
sudo useradd -r ghost -U
```

* 确保 Ghost 用户可以访问安装目录：

```bash
sudo chown -R ghost:ghost /你的 Ghost 安装目录
```

* 使用以下命令给这个初始化脚本加上可执行权限：

```bash
sudo chmod 755 /etc/init.d/ghost
```

* 现在你可以使用以下的命令来控制 Ghost ：

```bash
sudo service ghost start
sudo service ghost stop
sudo service ghost restart
sudo service ghost status
```

* 为了让 Ghost 能在系统启动时同时启动，我们必须要将刚刚创建的初始化脚本注册为为启动项。 执行以下两个命令：

```bash
sudo update-rc.d ghost defaults
sudo update-rc.d ghost enable
```

* 为了保证你的用户可以更改 Ghost 目录里的文件和默认的 `config.js` ，需要将你加入 ghost 用户组中：

```bash
sudo adduser 你的用户名 ghost
```

如果你现在重启你的服务器，Ghost 应该会自动运行。

> **该块内容摘自 Ghost 中文文档**

### 使用Nginx代理访问

如果你已经让 Ghost 一直运行了，你也可以设置一个代理服务器让你的博客可以使用域名访问。以下的示例假定你的操作系统是 Ubuntu 12.04 ，使用 Nginx 作为你的Web服务器，已经使用以上任意一种方法让 Ghost 在后台运行。

* 安装 nginx

```bash
sudo apt-get install nginx
```

> *这个命令将会安装nginx并且设定好所有必需的目录和基础配置。*

* 配置你的站点
  * 在 `/etc/nginx/sites-available` 创建一个 `ghost.conf` 文件  
  * 使用文本编辑器打开这个文件 (e.g. `sudo nano /etc/nginx/sites-available/ghost.conf`) 把以下内容复制进这个文件

```conf
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Host      $http_host;
        proxy_pass         http://127.0.0.1:2368;
    }
}
```

  * 将 server_name 的值改为你的域名

  * 把你的配置文件软链接到 sites-enabled 文件夹下:

```bash
sudo ln -s /etc/nginx/sites-available/ghost.conf /etc/nginx/sites-enabled/ghost.conf
```

  * 重启 nginx

```bash
sudo service nginx restart
```

至此，你的网站已经可以通过域名直接访问了。

> **该块内容摘自Ghost中文Doc**

### 使用Mysql来作为数据存储器  

Ghost 默认使用 sqlite3 数据库，对于一般使用足够了，但是内容多的话，就会拖慢整个系统，也就影响页面打开速度了，现在就来说说怎么配置 MySQL 数据库吧。

Ghost 安装目录下面有一个配置文件例子 -- `config.example.js`，我们复制一份这个文件，并修改名称为 `config.js`。
在生产环境下 Ghost 系统会加载 `production` 段的配置信息，因此，把 MySQL 的配置信息写到这一段就行。代码如下：

```JavaScript
// # Ghost Configuration
// Setup your Ghost install for various environments
var path = require('path'),
    config;
config = {
    // ### Development **(default)**
    development: {
        // The url to use when providing links to the site, E.g. in RSS and email.
        url: 'http://my-ghost-blog.com',
        // Example mail config
        // Visit http://docs.ghost.org/mail for instructions
        // ```
        //  mail: {
        //      transport: 'SMTP',
        //      options: {
        //          service: 'Mailgun',
        //          auth: {
        //              user: '', // mailgun username
        //              pass: ''  // mailgun password
        //          }
        //      }
        //  },
        // ```

        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/content/data/ghost-dev.db')
            },
            debug: false
        },
        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '2368'
        }
    },
    // ### Production  修改为使用 MySQL 数据库
    // When running Ghost in the wild, use the production environment
    // Configure your URL and mail settings here
    production: {
        url: 'http://my-ghost-blog.com',
        mail: {},
        database: {
            client: 'mysql',
            connection: {
                host     : '127.0.0.1',
                user     : 'username', //用户名
                password : '', //密码
                database : 'ghost', //数据库名
                charset  : 'utf8'
            }
        },
        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '2368'
        }
    },
    // **Developers only need to edit below here**
    // ### Testing
    // Used when developing Ghost to run tests and check the health of Ghost
    // Uses a different port number
    testing: {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/content/data/ghost-test.db')
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        }
    },
    // ### Travis
    // Automated testing run through GitHub
    'travis-sqlite3': {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/content/data/ghost-travis.db')
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        }
    },
    // ### Travis
    // Automated testing run through GitHub
    'travis-mysql': {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'mysql',
            connection: {
                host     : '127.0.0.1',
                user     : 'travis',
                password : '',
                database : 'ghost_travis',
                charset  : 'utf8'
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        }
    },
    // ### Travis
    // Automated testing run through GitHub
    'travis-pg': {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'pg',
            connection: {
                host     : '127.0.0.1',
                user     : 'postgres',
                password : '',
                database : 'ghost_travis',
                charset  : 'utf8'
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        }
    }
};
// Export config
module.exports = config;
```

> *配图会在近期加入*
> 参考：[Ghost官方Docs](http://docs.ghost.org/zh/)
> [让 Ghost 使用 MySQL 数据库 - 王赛](http://www.ghostchina.com/useing-mysql-database-with-ghost/)
