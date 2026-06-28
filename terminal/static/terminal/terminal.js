const input = document.getElementById('terminalInput')

const commands = {
    // args: string[] — e.g. ['username', 'pass123']
    help: {
        args: 0,
        handler: (args) => {
            console.log("Available commands: ...")
        }
    },
    register: {
        args: 2,
        handler: (args) => {
            console.log(`register called — username: ${args[0]}, password: ${args[1]}`)
        }
    },
    login: {
        args: 2,
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
        console.log(`wrong number of arguments for: ${command} (expected ${cmd.args}, got ${args.length})`)
        return
    }

    cmd.handler(args)
}

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const raw = input.value
        input.value=''
        handleCommand(raw)
    }
})