import formToRackParams from '.';

beforeEach(() => {
  document.body.replaceChildren();
});

function makeDOM(query) {
  const form = document.createElement('form');
  document.body.appendChild(form);
  const params = new URLSearchParams(query);
  for (const [key, value] of params.entries()) {
    const input = document.createElement('input');
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
}

// Mostly taken from https://github.com/rack/rack/blob/main/test/spec_utils.rb
describe.each([
  ['', {}],
  ['foo=', { foo: '' }],
  ['foo="bar"', { foo: '"bar"' }],
  ['foo=bar&foo=quux', { foo: 'quux' }],
  ['foo=1&bar=2', { foo: '1', bar: '2' }],
  ['foo=bar&baz=', { foo: 'bar', baz: '' }],
  ['my+weird+field=q1%212%22%27w%245%267%2Fz8%29%3F', { 'my weird field': 'q1!2"\'w$5&7/z8)?' }],
  ['a=b&pid%3D1234=1023', { 'pid=1234': '1023', a: 'b' }],
  ['foo[]=', { foo: [''] }],
  ['foo[]=bar', { foo: ['bar'] }],
  ['foo[]=bar&foo[=baz', { foo: ['bar'], 'foo[': 'baz' }],
  ['foo[]=bar&foo[]=', { foo: ['bar', ''] }],
  ['foo[]=1&foo[]=2', { foo: ['1', '2'] }],
  ['foo=bar&baz[]=1&baz[]=2&baz[]=3', { foo: 'bar', baz: ['1', '2', '3'] }],
  ['foo[]=bar&baz[]=1&baz[]=2&baz[]=3', { foo: ['bar'], baz: ['1', '2', '3'] }],
  ['x[y][z]=1', { x: { y: { z: '1' } } }],
  ['x[y][z][]=1', { x: { y: { z: ['1'] } } }],
  ['x[y][z][]=1&x[y][z]=2', { x: { y: { z: '2' } } }],
  ['x[y][z][]=1&x[y][z][]=2', { x: { y: { z: ['1', '2'] } } }],
  ['x[y][][z]=1', { x: { y: [{ z: '1' }] } }],
  ['x[y][][z][]=1', { x: { y: [{ z: ['1'] }] } }],
  ['x[y][][z]=1&x[y][][w]=2', { x: { y: [{ z: '1', w: '2' }] } }],
  ['x[y][][v][w]=1', { x: { y: [{ v: { w: '1' } }] } }],
  ['x[y][][z]=1&x[y][][v][w]=2', { x: { y: [{ z: '1', v: { w: '2' } }] } }],
  ['x[y][][z]=1&x[y][][z]=2', { x: { y: [{ z: '1' }, { z: '2' }] } }],
  ['x[y][][z]=1&x[y][][w]=a&x[y][][z]=2&x[y][][w]=3', { x: { y: [{ z: '1', w: 'a' }, { z: '2', w: '3' }] } }],
  ['x[][y]=1&x[][z][w]=a&x[][y]=2&x[][z][w]=b', { x: [{ y: '1', z: { w: 'a' } }, { y: '2', z: { w: 'b' } }] }],
  ['x[][z][w]=a&x[][y]=1&x[][z][w]=b&x[][y]=2', { x: [{ y: '1', z: { w: 'a' } }, { y: '2', z: { w: 'b' } }] }],
  ['data[books][][data][page]=1&data[books][][data][page]=2', { data: { books: [{ data: { page: '1' } }, { data: { page: '2' } }] } }],
  ['x[][y][][z]=1&x[][y][][w]=2', { x: [{ y: [{ z: '1', w: '2' }] }] }],
  [
    'x[][id]=1&x[][y][a]=5&x[][y][b]=7&x[][z][id]=3&x[][z][w]=0&x[][id]=2&x[][y][a]=6&x[][y][b]=8&x[][z][id]=4&x[][z][w]=0',
    {
      x: [
        { id: '1', y: { a: '5', b: '7' }, z: { id: '3', w: '0' } },
        { id: '2', y: { a: '6', b: '8' }, z: { id: '4', w: '0' } },
      ],
    },
  ],
  ['[]=1&[a]=2&b[=3&c]=4', { '[]': '1', '[a]': '2', 'b[': '3', 'c]': '4' }],
  ['d[[]=5&e][]=6&f[[]]=7', { d: { '[': '5' }, 'e]': ['6'], f: { '[': { ']': '7' } } }],
  ['g[h]i=8&j[k]l[m]=9', { g: { h: { i: '8' } }, j: { k: { 'l[m]': '9' } } }],
  ['l[[[[[[[[]]]]]]]=10', { l: { '[[[[[[[': { ']]]]]]': '10' } } }],
  ['[foo]=1', { '[foo]': '1' }],
  ['[foo][bar]=1', { '[foo]': { bar: '1' } }],
])('%s', (query, expected) => {
  it('is converted to params', () => {
    makeDOM(query);
    const form = document.querySelector('form');
    expect(formToRackParams(form)).toEqual(expected);
  });
});

describe('foo[__proto__][x]=1', () => {
  it('does not allow prototype injection', () => {
    makeDOM('foo[__proto__][x]=1');
    const form = document.querySelector('form');

    const ob = Object.create(null);
    ob.__proto__ = { x: '1' }; // eslint-disable-line no-proto

    expect(formToRackParams(form)).toEqual({ foo: ob });
  });
});

describe('foo[][__proto__][x]=1', () => {
  it('does not allow prototype injection', () => {
    makeDOM('foo[][__proto__][x]=1');

    const form = document.querySelector('form');

    const ob = Object.create(null);
    ob.__proto__ = { x: '1' }; // eslint-disable-line no-proto

    expect(formToRackParams(form)).toEqual({ foo: [ob] });
  });
});

describe('__proto__[x]=1', () => {
  it('does not allow prototype injection', () => {
    makeDOM('__proto__[x]=1');

    const form = document.querySelector('form');

    const ob = Object.create(null);
    ob.__proto__ = { x: '1' }; // eslint-disable-line no-proto

    expect(formToRackParams(form)).toEqual(ob);
  });
});

describe('x[y]=1&x[y]z=2', () => {
  it('raises an error', () => {
    makeDOM('x[y]=1&x[y]z=2');
    const form = document.querySelector('form');
    expect(() => {
      formToRackParams(form);
    }).toThrow('expected Hash (got String) for param `y`');
  });
});

describe('x[y]=1&x[]=1', () => {
  it('raises an error', () => {
    makeDOM('x[y]=1&x[]=1');
    const form = document.querySelector('form');
    expect(() => {
      formToRackParams(form);
    }).toThrow('expected Array (got object) for param `x`');
  });
});

describe('x[y]=1&x[y][][w]=2', () => {
  it('raises an error', () => {
    makeDOM('x[y]=1&x[y][][w]=2');
    const form = document.querySelector('form');
    expect(() => {
      formToRackParams(form);
    }).toThrow('expected Array (got string) for param `y`');
  });
});

describe('with a formData object', () => {
  it('is converted to params', () => {
    makeDOM('x=1');
    const formData = new FormData(document.querySelector('form'));
    expect(formToRackParams(formData)).toEqual({
      x: '1',
    });
  });
});
