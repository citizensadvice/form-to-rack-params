function paramsHashHasKey(hash, key) {
  if (key.includes('[]')) {
    return false;
  }

  let cursor = hash;
  for (const part of key.split(/[[\]]+/).filter(Boolean)) {
    if (typeof cursor !== 'object' || !cursor[part]) {
      return false;
    }
    cursor = cursor[part];
  }

  return true;
}

// This a direct copy from Rack
// https://github.com/rack/rack/blob/568dee5a2de80a9da20e2baf084b215abeee4ea8/lib/rack/query_parser.rb#L93
function normalizeParams(params, name, v, depth) {
  let k;
  let after;

  if (depth === 0) {
    // Start of parsing, don't treat [] or [ at start of string specially
    const start = name.indexOf('[', 1);
    if (start > -1) {
      // Start of parameter nesting, use part before brackets as key
      k = name.slice(0, start);
      after = name.slice(start, name.length);
    } else {
      // Plain parameter with no nesting
      k = name;
      after = '';
    }
  } else if (name.startsWith('[]')) {
    // Array nesting
    k = '[]';
    after = name.slice(2, name.length);
  } else if (name.startsWith('[')) {
    const end = name.indexOf(']', 1);
    if (end > -1) {
      // Hash nesting, use the part inside brackets as the key
      k = name.slice(1, end);
      after = name.slice(end + 1, name.length);
    } else {
      k = name;
      after = '';
    }
  } else {
    // Probably malformed input, nested but not starting with [
    // treat full name as key for backwards compatibility.
    k = name;
    after = '';
  }

  if (after === '') {
    if (k === '[]' && depth !== 0) {
      return [v];
    }
    params[k] = v;
  } else if (after === '[') {
    params[name] = v;
  } else if (after === '[]') {
    params[k] ||= [];
    if (!Array.isArray(params[k])) {
      throw new Error(`expected Array (got ${typeof params[k]}) for param \`${k}\``);
    }
    params[k].push(v);
  } else if (after.startsWith('[]')) {
    // Recognize x[][y] (hash inside array) parameters
    const childKey = after.slice(2, after.length);
    params[k] ||= [];
    if (!Array.isArray(params[k])) {
      throw new Error(`expected Array (got ${typeof params[k]}) for param \`${k}\``);
    }
    const last = params[k][params[k].length - 1];
    if (typeof last === 'object' && !paramsHashHasKey(last, childKey)) {
      normalizeParams(last, childKey, v, depth + 1);
    } else {
      params[k].push(normalizeParams(Object.create(null), childKey, v, depth + 1));
    }
  } else {
    params[k] ||= Object.create(null);
    if (typeof params[k] !== 'object') {
      throw new Error(`expected Hash (got ${params[k].constructor?.name}) for param \`${k}\``);
    }
    params[k] = normalizeParams(params[k], after, v, depth + 1);
  }

  return params;
}

export default function formToRackParams(form) {
  const data = new FormData(form);
  const serialized = Object.create(null);

  for (const [key, value] of data) {
    normalizeParams(serialized, key, value, 0);
  }

  return serialized;
}
