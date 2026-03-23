import { defineHandler } from 'h3'

export default defineHandler((event) => {
    return event.context?.matchedRoute?.route || event.url?.pathname || event.path
})
