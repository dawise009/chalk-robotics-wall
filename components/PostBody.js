import { renderMarkdown } from "../lib/markdown";

export default function PostBody({ body }) {
  const html = renderMarkdown(body);

  return (
    <div
      className="post-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
