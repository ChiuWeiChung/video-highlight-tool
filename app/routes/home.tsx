import type { Route } from "./+types/home";
import Main from "../components/Main";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Rick's Video Highlight Tool" },
    { name: "description", content: "Rick's Video Highlight Tool" },
  ];
}

export default function Home() {
  return <Main />;
}
