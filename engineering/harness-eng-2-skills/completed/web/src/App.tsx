import { Route, Routes } from 'react-router'
import { AppLayout } from './components/app-layout'
import { ToastProvider } from './components/toast'
import { BoardPage, TodosPage } from './features/todos'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodosPage />} />
          <Route path="board" element={<BoardPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
