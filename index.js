#!/usr/bin/env node

const child_process = require('child_process')
const fs = require('fs')

const comment = /^\s*[#]/

let parse = (input) => {
  let tasks = []
  let task = null
  let lines = input.split('\n')

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (line.test(comment)) continue

    if (line.indexOf('  ') === 0) {
      if (!task) {
        throw new Error(`Unexpected token at ${i+1}:1\n${line}`)
      } else if (line.indexOf('  ', 2) === 2) {
        const last = task.commands.length - 1
        task.commands[last] += ' ' + line.slice(4)
      } else {
        task.commands.push(line.slice(2))
      }
    } else if (!line) {
      if (task) {
        tasks.push(task)
        task = null
      }
    } else if (!task) {
      let deps = line.split(' ')
      let name = deps.shift()
      if (name[name.length-1] === ':') {
        if (task) tasks.push(task)
        name = name.slice(0, -1)
        task = { name, deps, commands: [] }
      } else {
        throw new Error(`Unexpected token at ${i+1}:${name.length+1}`)
      }
    } else {
      throw new Error(`Unexpected token at ${i+1}:1\n${line}`)
    }
  }

  return tasks
}

let run = (tasks, taskName) => {
  if (taskName[0] === '@') taskName = taskName.slice(1)
  let task = tasks.find(x => x.name === taskName)
  let deps = task.deps
  let pre = Promise.resolve(true)

  for (let i = 0; i < deps.length; i++) {
    let dep = deps[i]
    if (dep[0] === '@') {
      pre = Promise.all([pre, run(tasks, dep)])
    } else {
      pre = pre.then(() => run(tasks, dep))
    }
  }

  let env = Object.assign({}, process.env)
  env.PATH += ':node_modules/.bin'

  return pre.then(() => {
    let master = Promise.resolve(true)
    for (let c = 0; c < task.commands.length; c++) {
      (command => {
        master = master.then(() => new Promise((resolve, reject) => {
          const proc = child_process.exec(command, {
            maxBuffer: Infinity,
            encoding: 'buffer',
            cwd: process.cwd(),
            env
          })
          proc.on('close', () => resolve())
          proc.on('error', err => reject(err))
          proc.stdout.pipe(process.stdout)
          proc.stderr.pipe(process.stderr)
        }))
      })(task.commands[c])
    }
  })
}

fs.readFile(process.cwd() + '/buildfile', 'utf8', (err, data) => {
  if (err) throw err

  const tasks = parse(data)

  if (process.argv[2]) {
    run(tasks, process.argv[2])
  } else if (tasks.length > 0) {
    run(tasks, tasks[0].name)
  } else {
    console.log('No tasks to run')
  }
})
