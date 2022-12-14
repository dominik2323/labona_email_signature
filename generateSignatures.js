var inlineCss = require("inline-css");
const pug = require("pug");
const fs = require("fs");
const data = require("./data_source.json");
const slugify = require("slugify");

const everythingInsideBody = /<body[^>]*>(.*?)<\/body>/;
const api =
  "https://cdn.jsdelivr.net/gh/dominik2323/labona_email_signature@latest";

const compiledFunction = pug.compileFile("index.pug");

function makeSlug(str) {
  return slugify(str, {
    replacement: "-",
    trim: true,
    lower: true,
  });
}

let stackedHtml = "";
let markup = "";
data.forEach((person, i) => {
  const html = compiledFunction({
    api: api,
    title: person.title,
    surname: person.surname,
    name: person.name,
    position: person.position,
    photo: makeSlug(person.photoFileName.split(".")[0] + `.png`),
    phone: person.phone
      ? `+${person.phoneCode || "420"} ${person.phone}`
      : null,
    web: person.web,
    email: person.email,
    facebook: person.facebook,
    instagram: person.instagram,
    youtube: person.youtube,
    nps_claim: person.nps_claim.split(`? `),
    nps_link: person.nps_link,
  });
  const hasName = person.name && person.surname;
  const fileName = `${i}_${makeSlug(person.surname || ``)}_${makeSlug(
    person.name || ``
  )}_${person.nps}.html`;

  writeHtmlAsFile(html, hasName ? fileName : `${i}_info_${person.nps}.html`);

  // prepare markups for rendering all signatures
  const currentHtml = html.match(everythingInsideBody)[0];
  const wrappedHtml = `
    <div style="margin: 100px 0">
      ${currentHtml}
    </div>
  `;

  if (i === 0) {
    markup = html;
  }
  stackedHtml = stackedHtml + wrappedHtml;
});

const prependMsg = (html) => `
  <h1>Jen pro kontrolu. Nepoužívat pro vytváření podpisů</h1>
  ${html}
`;

// render all signatures
const finalMarkup = markup.replace(
  everythingInsideBody,
  prependMsg(stackedHtml)
);
writeHtmlAsFile(finalMarkup, "!!!_preview.html");

function writeHtmlAsFile(html, fileName) {
  inlineCss(html, { url: `file://${__dirname}/` }).then((html) => {
    fs.writeFile(`export/${fileName}`, html, (err) => {
      if (err) console.log(err);
    });
  });
}
