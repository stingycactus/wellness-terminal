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

const commands = {
    // args: string[] — e.g. ['username', 'pass123']
    help: {
        args: 0,
        usage: "help",
        description: "Shows available commands with info",
        handler: (args) => {
            console.log("Available commands: ")
            for (const cmd in commands) {
                console.log(`${commands[cmd].usage} \t ${commands[cmd].description}`)
            }
        }
    },
    register: {
        args: 2,
        usage: "register <name> <pass>",
        description: "Register to make an account",
        handler: (args) => {
            console.log(`register called — username: ${args[0]}, password: ${args[1]}`)
        }
    },
    login: {
        args: 2,
        usage: "login <name> <pass>",
        description: "Login to an existing account",
        handler: (args) => {
            console.log(`login called — username: ${args[0]}, password: ${args[1]}`)
        }
    },
    focus: {
        args: -1, // -1 because it can any number of args
        usage: "focus <area1> <area2> ...",
        description: "Set some focus areas, such as sleep, confidence, etc",
        handler: async (args) => {
            const output = await sendToServer('focus', args)
            console.log(output)
        }
    },
    reset: { // for debugging
        args: 0,
        usage: "reset",
        description: "Clears session storage",
        handler: async (args) => {
            const output = await sendToServer('reset', args)
            console.log(output)
        }
    }
}

function handleCommand (raw) {
    if (!raw.trim()) return // checks if raw is empty

    const parts = raw.trim().split(' ') // splits each word into parts array
    const command = parts[0].toLowerCase()
    const args = parts.slice(1) // args is from 1st elem in array upwards ['register' 'user' 'pass'] => ['user' 'pass']

    console.log('❯ ' + raw)

    if (!commands[command]) {
        console.log(`command not found: "${command}"`)
        return
    }
    
    const cmd = commands[command]

    if (cmd.args !== -1 && args.length !== cmd.args) {
        console.log(`${cmd.usage} \t ${cmd.description}`)
        return
    }

    cmd.handler(args)
}

const input = document.getElementById('terminalInput')

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const raw = input.value
        input.value=''
        handleCommand(raw)
    }
})