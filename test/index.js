var fs = require('fs')
var path = require('path')
var expect = require('expect')
var mock = require('mock-fs')
var husky = require('../src')

var gitDir = '/.git'

function readHook (hookPath) {
  return fs.readFileSync(path.join(gitDir, hookPath), 'utf-8')
}

function exists (hookPath) {
  return fs.existsSync(path.join(gitDir, hookPath))
}

describe('husky', function () {
  afterEach(function () {
    mock.restore()
  })

  it('should support basic layout', function () {
    mock({
      '/.git/hooks': {},
      '/node_modules/husky': {}
    })

    husky.installFrom('/node_modules/husky')
    var hook = readHook('hooks/pre-commit')

    expect(hook).toInclude('#husky')
    expect(hook).toInclude('cd .')
    expect(hook).toInclude('npm run precommit')

    husky.uninstallFrom('/node_modules/husky')
    expect(exists('hooks/pre-push')).toBeFalsy()
  })

  it('should support project installed in sub directory', function () {
    mock({
      '/.git/hooks': {},
      '/A/B/node_modules/husky': {}
    })

    husky.installFrom('/A/B/node_modules/husky')
    var hook = readHook('hooks/pre-commit')

    expect(hook).toInclude('cd A/B')

    husky.uninstallFrom('/A/B/node_modules/husky')
    expect(exists('hooks/pre-push')).toBeFalsy()
  })

  it('should support git submodule', function () {
    mock({
      '/.git/modules/A/B': {},
      '/A/B/.git': 'git: ../../.git/modules/A/B',
      '/A/B/node_modules/husky': {}
    })

    husky.installFrom('/A/B/node_modules/husky')
    var hook = readHook('modules/A/B/hooks/pre-commit')

    expect(hook).toInclude('cd .')

    husky.uninstallFrom('/A/B/node_modules/husky')
    expect(exists('hooks/pre-push')).toBeFalsy()
  })

  it('should support git submodule and sub directory', function () {
    mock({
      '/.git/modules/A/B': {},
      '/A/B/.git': 'git: ../../.git/modules/A/B',
      '/A/B/C/node_modules/husky': {}
    })

    husky.installFrom('/A/B/C/node_modules/husky')
    var hook = readHook('modules/A/B/hooks/pre-commit')

    expect(hook).toInclude('cd C')

    husky.uninstallFrom('/A/B/app/node_modules/husky')
    expect(exists('hooks/pre-push')).toBeFalsy()
  })

  it('should not modify user hooks', function () {
    mock({
      '/.git/hooks': {},
      '/.git/hooks/pre-push': 'foo',
      '/node_modules/husky': {}
    })

    // Verify that it's not overwritten
    husky.installFrom('/node_modules/husky')
    var hook = readHook('hooks/pre-push')
    expect(hook).toBe('foo')

    husky.uninstallFrom('/node_modules/husky')
    expect(exists('hooks/pre-push')).toBeTruthy()
  })

  it('should not install from /node_modules/A/node_modules', function () {
    mock({
      '/.git/hooks': {},
      '/node_modules/A/node_modules/husky': {}
    })

    husky.installFrom('/node_modules/A/node_modules/husky')
    expect(exists('hooks/pre-push')).toBeFalsy()
  })

  it('should not crash if there\'s no .git directory', function () {
    mock({
      '/node_modules/husky': {}
    })

    expect(function () { husky.installFrom('/node_modules/husky') })
      .toNotThrow()

    expect(function () { husky.uninstallFrom('/node_modules/husky') })
      .toNotThrow()
  })
})
