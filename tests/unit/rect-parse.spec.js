const path = require('path')

describe('rect parse/validate', ()=>{
  const mod = require(path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/script.js'))

  test('valid numbers parse', ()=>{
    const r = mod.parseRectInputs('10', '20', '30', '40')
    expect(r.valid).toBe(true)
    expect(r.x).toBeCloseTo(10)
    expect(r.y).toBeCloseTo(20)
    expect(r.w).toBeCloseTo(30)
    expect(r.h).toBeCloseTo(40)
  })

  test('invalid when any NaN or non-positive size', ()=>{
    expect(mod.parseRectInputs('a', '20', '30', '40').valid).toBe(false)
    expect(mod.parseRectInputs('10', '20', '0', '40').valid).toBe(false)
    expect(mod.parseRectInputs('10', '20', '-1', '40').valid).toBe(false)
  })
})

