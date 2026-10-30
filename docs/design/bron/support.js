/**
 * Kleine vervanger van de runtime van Claude Design, zodat de frames in docs/design/bron/
 * ook buiten claude.ai te bekijken zijn. Ondersteunt alleen wat deze frames gebruiken:
 * <helmet>, <sc-if value>, <sc-for list as>, {{ expressies }} in tekst en attributen,
 * on*-attributen als klikfunctie, en een Component-klasse met props, state en setState.
 * Props komen uit de standaardwaarden in data-props en kunnen via de URL worden gezet,
 * bijvoorbeeld Main.dc.html?staat=leeg of Uitzending.dc.html?frame=eind.
 * Alleen een hulpmiddel voor het ontwerp; de app zelf gebruikt dit niet.
 */
(() => {
  const PATROON = /\{\{\s*([\s\S]+?)\s*\}\}/g;

  /** Rekent een expressie uit met de waarden van de scope. */
  function reken(expressie, scope) {
    return new Function('scope', `with (scope) { return (${expressie}); }`)(scope);
  }

  /** Vervangt alle {{ expressies }} in een tekst. */
  function vul(tekst, scope) {
    return tekst.replace(PATROON, (_, e) => {
      const waarde = reken(e, scope);
      return waarde === undefined || waarde === null ? '' : String(waarde);
    });
  }

  /** Verwerkt de attributen van één element. */
  function verwerkAttributen(el, scope) {
    for (const attr of [...el.attributes]) {
      const naam = attr.name;
      if (naam.startsWith('hint-')) { el.removeAttribute(naam); continue; }
      if (!attr.value.includes('{{')) continue;
      const enkel = attr.value.trim().match(/^\{\{\s*([\s\S]+?)\s*\}\}$/);
      if (naam.startsWith('on')) {
        el.removeAttribute(naam);
        const functie = enkel ? reken(enkel[1], scope) : null;
        if (typeof functie === 'function') el.addEventListener(naam.slice(2), functie);
      } else if (enkel && typeof reken(enkel[1], scope) === 'boolean') {
        if (reken(enkel[1], scope)) el.setAttribute(naam, ''); else el.removeAttribute(naam);
      } else {
        el.setAttribute(naam, vul(attr.value, scope));
      }
    }
  }

  /** Verwerkt een knoop en alles eronder. */
  function verwerk(knoop, scope) {
    for (const kind of [...knoop.childNodes]) {
      if (kind.nodeType === Node.TEXT_NODE) {
        if (kind.nodeValue.includes('{{')) kind.nodeValue = vul(kind.nodeValue, scope);
        continue;
      }
      if (kind.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = kind.localName;
      if (tag === 'sc-if') {
        const waar = reken(kind.getAttribute('value').replace(PATROON, '$1'), scope);
        if (waar) {
          verwerk(kind, scope);
          kind.replaceWith(...kind.childNodes);
        } else {
          kind.remove();
        }
      } else if (tag === 'sc-for') {
        const lijst = reken(kind.getAttribute('list').replace(PATROON, '$1'), scope) ?? [];
        const als = kind.getAttribute('as');
        const delen = [];
        for (const item of lijst) {
          const kopie = kind.cloneNode(true);
          verwerk(kopie, { ...scope, [als]: item });
          delen.push(...kopie.childNodes);
        }
        kind.replaceWith(...delen);
      } else {
        verwerkAttributen(kind, scope);
        verwerk(kind, scope);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const xdc = document.querySelector('x-dc');
    const helmet = xdc.querySelector('helmet');
    if (helmet) { document.head.append(...helmet.childNodes); helmet.remove(); }
    const sjabloon = xdc.innerHTML;

    const script = document.querySelector('script[data-dc-script]');
    const definitie = JSON.parse(script.dataset.props || '{}');
    const zoek = new URLSearchParams(location.search);
    const props = {};
    for (const [naam, def] of Object.entries(definitie)) {
      if (naam.startsWith('$')) continue;
      props[naam] = def.default;
      if (zoek.has(naam)) {
        const v = zoek.get(naam);
        props[naam] = v === 'true' ? true : v === 'false' ? false : v;
      }
    }

    let component;
    const teken = () => {
      const houder = document.createElement('div');
      houder.innerHTML = sjabloon;
      verwerk(houder, component.renderVals());
      xdc.replaceChildren(...houder.childNodes);
    };
    class DCLogic {
      constructor(p) { this.props = p; this.state = {}; }
      setState(deel) { Object.assign(this.state, deel); teken(); }
    }
    const Component = new Function('DCLogic', `${script.textContent}; return Component;`)(DCLogic);
    component = new Component(props);
    teken();
    if (component.componentDidMount) component.componentDidMount();
    document.documentElement.dataset.klaar = 'ja';
  });
})();
