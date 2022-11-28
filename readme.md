# Amira
Amira is a simple starter CMS module for nodejs. It is design to cater the core requirements of a Content Management type of application.

By default *Amira* does not contain much but the module allows you to create an application without any code alteration.

## Installation
```ssh
$ npm install amira --save
```

After installation you'll gonna have to navigate to your application's main folder to run the config command which will create the configuration file.
```ssh
$ amira config
```

You may edit **.env** file to set the right configuration to run your application. Then run the config command again to validate your configuration and set the default settings.

## Usage

#### .serve(port: Int, host: String, ssl: Object, html: Function)

#### .serveClient(port: Int, host: String, ssl: Object, html: Function)

#### .serveAdmin(port: Int, host: String, ssl: Object, html: Function)

#### .serveAPI(port: Int, host: String, ssl: Object)