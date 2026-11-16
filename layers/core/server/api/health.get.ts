import { defineEventHandler } from 'nuxt/server'
import { publicPassThrough } from '../utils/passthrough'

export default defineEventHandler(event => publicPassThrough(event, '/health', 'GET'))
