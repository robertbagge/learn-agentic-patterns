import { useEffect, useState } from 'react'

export default function App() {
  const [result, setResult] = useState('')

  useEffect(() => {
    fetch(`http://localhost:${import.meta.env.VITE_API_PORT}/hello`)
      .then((r) => r.json())
      .then(setResult)
  }, [])

  return <h1>Hello, {result}!</h1>
}
