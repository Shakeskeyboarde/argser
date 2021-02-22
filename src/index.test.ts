import argser from '.';

it('should not use values for flags', () => {
  expect(
    argser(['-a=1', '-b', '2'], {
      a: false,
      b: false,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [
        "2",
      ],
      "a": true,
      "b": true,
    }
  `);
});

it('should use values for options', () => {
  expect(
    argser(['-a=1', '-b', '2'], {
      a: true,
      b: true,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [],
      "a": "1",
      "b": "2",
    }
  `);
});

it('should parse values when given a "value" function', () => {
  expect(
    argser(['-a=1', '-b', '2'], {
      a: parseInt,
      b: parseInt,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [],
      "a": 1,
      "b": 2,
    }
  `);
});

it('should output an array of values for "many" options', () => {
  expect(
    argser(['-a=1', '-b', '2'], {
      a: { value: parseInt, many: true, alias: 'b' },
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [],
      "a": Array [
        1,
        2,
      ],
    }
  `);
});

it('should use process.argv.slice(2) when no arguments array is given', () => {
  process.argv = [...process.argv.slice(0, 2), '-a=1', '-b', '2'];
  expect(
    argser({
      a: true,
      b: true,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [],
      "a": "1",
      "b": "2",
    }
  `);
});

it('should throw an error when an unknown option is used', () => {
  expect(() => {
    argser(['-c'], {
      a: true,
      b: true,
    });
  }).toThrow();
});

it('should stop parsing options when -- is encountered', () => {
  expect(
    argser(['-a=1', '--', '-b', '2'], {
      a: true,
      b: true,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [
        "-b",
        "2",
      ],
      "a": "1",
      "b": undefined,
    }
  `);
});

it('should treat an empty option definition ({}) as a flag', () => {
  expect(
    argser(['-a=1', '-b', '2'], {
      a: {},
      b: {},
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [
        "2",
      ],
      "a": true,
      "b": true,
    }
  `);
});

it('should ignore a definition for underscore (_)', () => {
  expect(
    argser(['-a=1', '-b', '2'], {
      a: false,
      b: false,
      _: false,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "_": Array [
        "2",
      ],
      "a": true,
      "b": true,
    }
  `);
});

it('should throw an error if an option is missing its value', () => {
  expect(() => {
    argser(['-a'], {
      a: true,
    });
  }).toThrow();
});
