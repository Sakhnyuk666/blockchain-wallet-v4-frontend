import Channel from '@nodeguy/channel'

import { ChildProcess } from '../../web-microkernel/src'

const head = `
  <meta charset="UTF-8" />
  <link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16x16.png">
  <link rel="manifest" href="/img/site.webmanifest">
  <link rel="mask-icon" href="/img/safari-pinned-tab.svg" color="#5bbad5">
  <link rel="shortcut icon" href="/img/favicon.ico">
  <meta name="msapplication-TileColor" content="#2d89ef">
  <meta name="msapplication-config" content="/img/browserconfig.xml">
  <meta name="theme-color" content="#ffffff">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
  <meta name="theme-color" content="#187fc0">
  <meta name="apple-itunes-app" content="app-id=493253309">
  <meta name="description" content="Discover the world's most popular bitcoin wallet. Visit today to create your free simple, secure and safe Blockchain Wallet.">
  <meta name="keywords" content="bitcoin wallet, blockchain wallet, online bitcoin wallet, bitcoin wallet online">
  <title>Blockchain Wallet - Exchange Cryptocurrency</title>
`

const LOCATION_CHANGE = `@@router/LOCATION_CHANGE`

const securityProcessPaths = [
  `/help`,
  `/login`,
  `/recover`,
  `/reminder`,
  `/reset-2fa`,
  `/security-center`,
  `/signup`
]

const pathnameIsInSecurityProcess = pathname =>
  securityProcessPaths.some(path => pathname.startsWith(path))

const exportedFunction = async ({ createProcess, setForeground, setHead }) => {
  setHead(head)

  const securityProcess = await createProcess({
    src: `http://localhost:8080`
  })

  const mainProcess = await createProcess({
    src: `http://localhost:8082`
  })

  const displayMainProcess = () => {
    setForeground(mainProcess, `red`)
  }

  const displaySecurityProcess = () => {
    setForeground(securityProcess, `lightgreen`)
  }

  displaySecurityProcess()
  const mainProcessActionsChannel = Channel()

  const dispatchFromSecurityProcess = action => {
    if (action.type === LOCATION_CHANGE) {
      if (pathnameIsInSecurityProcess(action.payload.location.pathname)) {
        displaySecurityProcess()
      } else {
        mainProcessActionsChannel.push(action)
        displayMainProcess()
      }
    }
  }

  const securityProcessExports = await securityProcess({
    rootProcessDispatch: dispatchFromSecurityProcess,
    mainProcessDispatch: mainProcessActionsChannel.push
  })

  const dispatchFromMainProcess = action => {
    if (action.type === LOCATION_CHANGE) {
      if (pathnameIsInSecurityProcess(action.payload.location.pathname)) {
        securityProcessExports.dispatch(action)
        displaySecurityProcess()
      } else {
        displayMainProcess()
      }
    }
  }

  const mainProcessExports = await mainProcess({
    securityProcess: securityProcessExports,
    rootProcessDispatch: dispatchFromMainProcess
  })

  await mainProcessActionsChannel.forEach(mainProcessExports.dispatch)
}

;(async () => {
  const childProcess = await ChildProcess({}, exportedFunction)
  childProcess.addEventListener(`error`, console.error)
})().catch(console.error)
