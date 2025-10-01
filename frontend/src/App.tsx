import React, { useState } from 'react'
import { Box, Button, Input, Text } from '@chakra-ui/react'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Выберите PDF файл')
      return
    }
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: 'Ошибка' }))
        setMessage('Ошибка: ' + (e.detail || JSON.stringify(e)))
        return
      }
      const data = await res.json()
      setMessage(data.message)
    } catch (err) {
      console.error(err)
      setMessage('Ошибка соединения с сервером')
    }
  }

  return (
    <Box p={6} maxW="700px" mx="auto">
      <Text fontSize="2xl" mb={4}>Загрузка PDF</Text>
      <Input type="file" accept="application/pdf" onChange={handleFileChange} mb={4} />
      <Button colorScheme="teal" onClick={handleUpload}>Загрузить</Button>
      <Text mt={4}>{message}</Text>
    </Box>
  )
}

export default App
