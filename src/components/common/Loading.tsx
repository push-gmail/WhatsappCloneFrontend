export default function Loading({ text = "Loading..." }: { text?: string }) {
  return <div className="loading"><span className="spinner" />{text}</div>;
}
