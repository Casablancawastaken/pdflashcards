import { useState } from "react";
import { Box, Button, Container, Heading, Input, Text } from "@chakra-ui/react";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Сначала выберите PDF");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-pdf/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
      } else {
        setMessage("Ошибка загрузки файла");
      }
    } catch (error) {
      setMessage("Ошибка сети: " + error);
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Heading mb={6}>Загрузка PDF</Heading>
      <Box mb={4}>
        <Input type="file" accept="application/pdf" onChange={handleFileChange} />
      </Box>
      <Button colorScheme="blue" onClick={handleUpload}>
        Загрузить
      </Button>
      {message && (
        <Text mt={4} color="green.500">
          {message}
        </Text>
      )}
    </Container>
  );
}

export default App;
