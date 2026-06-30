async function sendToServer(command, args) {
    try {
        const response = await fetch('/api/command/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command, args: args })
        })
        const data = await response.json()
        return data.output || 'no response from server'
    } catch (error) {
        console.log('Server error:', error)
        return 'error: could not reach server'
    }
}

function formatSessionStart() {
  const now = new Date()

  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `session started — ${day}.${month}.${year} <span class="session-dot">·</span> ${hours}:${minutes}`
}

document.getElementById('sessionStart').innerHTML = formatSessionStart()

function appendLine(text, className = 'terminal-line') {
    const line = document.createElement('div')
    line.className = className
    line.textContent = text

    const commandLine = document.querySelector('.command-line')
    commandLine.parentNode.insertBefore(line, commandLine)
}

function clearLine() {
    document.querySelectorAll('.terminal-line').forEach(line => line.remove())
}

const commands = {
    // args: string[] — e.g. ['username', 'pass123']
    help: {
        usage: "help",
        description: "Shows available commands with info",
        handler: (args) => {
            appendLine("Available commands: ")
            for (const cmd in commands) {
                appendLine(`${commands[cmd].usage} — ${commands[cmd].description}`)
            }
        }
    },
    register: {
        usage: "register <name> <pass>",
        description: "Register to make an account",
        handler: (args) => {
            console.log(`register called — username: ${args[0]}, password: ${args[1]}`)
        }
    },
    login: {
        usage: "login <name> <pass>",
        description: "Login to an existing account",
        handler: (args) => {
            console.log(`login called — username: ${args[0]}, password: ${args[1]}`)
        }
    },
    focus: {
        usage: "focus [area1] [area2] ...",
        description: "Set some focus areas, such as sleep, confidence, etc",
        handler: async (args) => {
            const output = await sendToServer('focus', args)
            console.log(output)
        }
    },
    get_quests: {
        usage: "get_quests [--new]",
        description: "Generate quests based on your focus areas and difficulty",
        handler: async (args) => {
            const output = await sendToServer('get_quests', args)
            console.log(output)
        }
    },
    difficulty: {
        usage: "difficulty <easy/medium/hard/...>",
        description: "Increase difficulty of newly generated quests",
        handler: async (args) => {
            const output = await sendToServer('difficulty', args)
            console.log(output)
        }
    },
    reset: { // for debugging
        usage: "reset",
        description: "Clears session storage",
        handler: async (args) => {
            const output = await sendToServer('reset', args)
            console.log(output)
        }
    },
    clear: {
        usage: "clear",
        description: "Clears terminal",
        handler: async (args) => {
            clearLine()
        }
    }
}

async function handleCommand (raw) {
    if (!raw.trim()) return // checks if raw is empty

    const parts = raw.trim().split(' ') // splits each word into parts array
    const command = parts[0].toLowerCase()
    const args = parts.slice(1) // args is from 1st elem in array upwards ['register' 'user' 'pass'] => ['user' 'pass']

    console.log('❯ ' + raw)

    if (!commands[command]) {
        console.log(`command not found: "${command}"`)
        return
    }
    
    await commands[command].handler(args)
}

const input = document.getElementById('terminalInput')

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const raw = input.value
        input.value=''
        handleCommand(raw)
    }
})