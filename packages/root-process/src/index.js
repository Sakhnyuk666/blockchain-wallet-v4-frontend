import { Kernel } from '../../web-microkernel/src'
;(async () => {
  const kernel = Kernel()
  kernel.addEventListener(`error`, console.error)

  const rootProcess = await kernel.createProcess({
    src: `http://localhost:9000/rootProcess.html`
  })

  await rootProcess({ ...kernel })
})().catch(console.error)
