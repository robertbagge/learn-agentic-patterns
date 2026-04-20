import { ToastProvider } from './components/toast'
import { TodosPage } from './features/todos'

export default function App() {
  return (
    <ToastProvider>
      <TodosPage />
    </ToastProvider>
  )
}
