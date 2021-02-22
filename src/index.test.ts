import argser from '.';

describe('argser', () => {
  it('should not use values for flags', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: false,
        b: false,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "2",
          ],
          "a": true,
          "b": true,
        },
        null,
      ]
    `);
  });

  it('should use values for options', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": "1",
          "b": "2",
        },
        null,
      ]
    `);
  });

  it('should parse values when given a "value" function', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: parseInt,
        b: parseInt,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": 1,
          "b": 2,
        },
        null,
      ]
    `);
  });

  it('should output an array of values for "many" options', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: { value: parseInt, many: true, alias: 'b' },
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": Array [
            1,
            2,
          ],
        },
        null,
      ]
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
      Array [
        Object {
          "_": Array [],
          "a": "1",
          "b": "2",
        },
        null,
      ]
    `);
  });

  it('should return an error when an unknown option is used', () => {
    expect(
      argser(['-c'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-c",
          ],
          "a": undefined,
          "b": undefined,
        },
        [Error: Argument "-c" is unknown.],
      ]
    `);
  });

  it('should stop parsing options when -- is encountered', () => {
    expect(
      argser(['-a=1', '--', '-b', '2'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-b",
            "2",
          ],
          "a": "1",
          "b": undefined,
        },
        null,
      ]
    `);
  });

  it('should treat an empty option definition ({}) as a flag', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: {},
        b: {},
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "2",
          ],
          "a": true,
          "b": true,
        },
        null,
      ]
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
      Array [
        Object {
          "_": Array [
            "2",
          ],
          "a": true,
          "b": true,
        },
        null,
      ]
    `);
  });

  it('should return an error if an option is missing its value', () => {
    expect(
      argser(['-a'], {
        a: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-a",
          ],
          "a": undefined,
        },
        [Error: Argument "-a" requires a value.],
      ]
    `);
  });
});

describe('argser.command', () => {
  it('should return the first matching command', () => {
    expect(argser.command(['b', 'c', '--arg'], 'a', 'b')).toMatchInlineSnapshot(`
      Array [
        "b",
        Array [
          "c",
          "--arg",
        ],
      ]
    `);
  });

  it('should use process.argv.slice(2) when no arguments array is given', () => {
    process.argv = [...process.argv.slice(0, 2), 'b', 'c', '--arg'];
    expect(argser.command('a', 'b')).toMatchInlineSnapshot(`
      Array [
        "b",
        Array [
          "c",
          "--arg",
        ],
      ]
    `);
  });

  it('should return undefined if no command is matched', () => {
    expect(argser.command(['b', 'c', '--arg'], 'a')).toMatchInlineSnapshot(`
      Array [
        undefined,
        Array [
          "b",
          "c",
          "--arg",
        ],
      ]
    `);
  });
});
