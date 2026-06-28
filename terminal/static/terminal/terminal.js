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