/**
 * Page text from the site, as the HTML its own renderer made. The backend
 * cleans it (only the markup prose needs, links that open safely, images from
 * the site), which is what makes it safe to put on the page as it is.
 */
export function Prose({ html }: { html: string }) {
  // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- cleaned by the backend, see above
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
