import { describe, expect, it } from 'vitest'
import { evaluateBudgets } from '../check-bundle.mjs'
import { render, toNames } from '../new-feature.mjs'

describe('check-bundle budgets', () => {
  it('applies the entry and chunk budgets', () => {
    const KB = 1024
    expect(evaluateBudgets([{ file: 'entry.js', gzip: 190 * KB }, { file: 'a.js', gzip: 120 * KB }], 'entry.js')).toEqual([])
    expect(evaluateBudgets([{ file: 'entry.js', gzip: 210 * KB }, { file: 'a.js', gzip: 160 * KB }], 'entry.js')).toHaveLength(2)
  })
})

describe('new-feature generator', () => {
  it('derives names', () => {
    expect(toNames('Invoice Items')).toEqual({ name: 'invoice-items', Name: 'InvoiceItems', label: 'Invoice Items', camel: 'invoiceItems' })
    expect(() => toNames('9lives')).toThrow()
  })
  it('renders tokens', () => {
    expect(render('use__Name__Queries __name__Keys __name__.view __label__', toNames('invoices'))).toBe('useInvoicesQueries invoicesKeys invoices.view Invoices')
  })
})
