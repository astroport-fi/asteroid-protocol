#!/usr/bin/env node
import { program } from 'commander'
import './commands/bridge.js'
import './commands/cft20.js'
import './commands/grant.js'
import './commands/inscription.js'
import './commands/marketplace.js'
import './commands/trollbox.js'

program.parseAsync()
