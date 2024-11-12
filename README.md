# `formToRackParams(form: HTMLFormElement | FormData): Object`

[![npm version](https://badge.fury.io/js/@citizensadvice%2Fform-to-rack-params.svg)](https://badge.fury.io/js/@citizensadvice%2Fform-to-rack-params)

Converts a `<Form>`'s parameters to an object using the same logic as [Rack](https://github.com/rack/rack).

This is mainly intended for testing JavaScript components that generate HTML forms to be submitted to Rails.

```html
<form>
  <input
    type="hidden"
    name="foo[bar][][id]"
    value="1"
  />
  <input
    type="hidden"
    name="foo[bar][][id]"
    value="2"
  />
</form>
```

```js
import formToRackParams from '@citizensadvice/form-to-rack-params';

const form = document.querySelector('form');
formToRakeParams(form);

/* =>
  foo: {
    bar: [
      { id: '1' },
      { id: '2' },
    ],
  }
*/
```
