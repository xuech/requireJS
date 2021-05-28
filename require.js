const path = require('path')
const fs = require('fs')
const vm = require('vm')

function Module(id) {
  this.id = id
  this.exports = {}
}

// 4、根据文件后缀选择不同的方法进行执行
Module.prototype.load = function (filename) {
  const extname = path.extname(filename)
  Module._extensions[extname](this)
}

Module.warp = function (script) {
  let arr = [
    '(function (exports,require,module,__filename,__dirname){',
    script,
    '})',
  ]
  return arr.join('')
}
Module.cache = {}
Module._extensions = {
  '.js': function (module) {
    const content = fs.readFileSync(module.id, 'utf8')
    const warp = Module.warp(content)
    const fn = vm.runInThisContext(warp)
    const exports = module.exports
    const require = myRequire
    const __filename = module.id
    const __dirname = path.dirname(module.id)
    console.log(__filename, __dirname)
    // 这里的this就是exports对象
    fn.call(exports, exports, require, module, __filename, __dirname)
  },
  '.json': function (module) {
    // 5、调用readFileSync读取文件内容并复值给 `module.exports`
    module.exports = JSON.parse(fs.readFileSync(module.id))
  },
}
Module._resolveFilename = function (filePath) {
  // 根据文件名拿到绝对路径
  let pathFile = path.resolve(__dirname, filePath)
  let exists = fs.existsSync(pathFile)
  // 如果文件存在就直接返回
  if (exists) {
    return pathFile
  }
  // 寻找后缀，并拼接
  let keys = Object.keys(Module._extensions)
  for (let index = 0; index < keys.length; index++) {
    const fullPath = pathFile + keys[index]
    if (fs.existsSync(fullPath)) {
      return fullPath
    }
  }
}
Module._load = function (filePath) {
  // 2、调用Module的_resolveFilename静态方法，得到绝对路径
  let absoultePath = Module._resolveFilename(filePath)

  // 3、如果缓存中存在对应的module就直接返回exports
  let cacheModule = Module.cache[absoultePath]
  if (cacheModule) {
    return cacheModule.exports
  }
  // 3、new一个Moudule实例，调用实例上的load方法，并把绝对路径传过去
  const module = new Module(absoultePath)
  Module.cache[absoultePath] = module
  // module.load(absoultePath)
  // 加载模块
  let hadException = true
  try {
    module.load(absoultePath)
    hadException = false
  } finally {
    if (hadException) {
      delete Module._cache[filename]
    }
  }
  return module.exports
}

function myRequire(filepath) {
  // 1、调用Module的_load静态方法，该方法会返回 module.exports
  return Module._load(filepath)
}

let a = myRequire('./a')
myRequire('./a')
myRequire('./a')
console.log(a, b, c)
