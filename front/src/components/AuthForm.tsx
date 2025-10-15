import { useState } from "react"
import { Box, Button, Input, VStack, Text } from "@chakra-ui/react"

interface AuthFormProps {
  onSubmit: (values: Record<string, string>) => Promise<void>
  fields: { name: string; placeholder: string; type?: string }[]
  buttonText: string
}

const AuthForm = ({ onSubmit, fields, buttonText }: AuthFormProps) => {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      await onSubmit(values)
    } catch (e) {
      if (e instanceof Error) setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="sm" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <VStack spacing={4}>
        {fields.map((f) => (
          <Input
            key={f.name}
            type={f.type || "text"}
            placeholder={f.placeholder}
            value={values[f.name] || ""}
            onChange={(e) => handleChange(f.name, e.target.value)}
          />
        ))}
        {error && <Text color="red.500">{error}</Text>}
        <Button colorScheme="blue" w="100%" onClick={handleSubmit} isLoading={loading}>
          {buttonText}
        </Button>
      </VStack>
    </Box>
  )
}

export default AuthForm
