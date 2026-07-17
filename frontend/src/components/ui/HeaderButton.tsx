import { Button } from './button.tsx';

export default function HeaderButton({ text }: { text: string }) {
  return (
    <div>
      <p>{text}</p>
      <Button size="icon"></Button>
    </div>
  );
}
