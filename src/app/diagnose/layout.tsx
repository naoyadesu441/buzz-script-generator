import { DiagnoseProvider } from './DiagnoseContext';

export default function DiagnoseLayout({ children }: { children: React.ReactNode }) {
  return <DiagnoseProvider>{children}</DiagnoseProvider>;
}
