import { Box, Container, Heading, Text } from '@chakra-ui/react'
import PdfUpload from '../components/PdfUpload'

const Home = () => {
  return (
    <Container maxW="lg" py={10}>
      <Heading mb={4}>Загрузка PDF → извлечение текста</Heading>
      <Text mb={6}>
        Загрузите PDF, backend распарсит первые страницы и вернёт превью текста.
      </Text>
      <Box>
        <PdfUpload />
      </Box>
    </Container>
  )
}

export default Home
