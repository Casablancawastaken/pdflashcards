import { useParams, useNavigate } from "react-router-dom";
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";

const UploadCards = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <VStack align="stretch" spacing={4}>
      <Button onClick={() => navigate(-1)}>← Назад</Button>

      <Heading size="lg">Карточки для файла #{id}</Heading>
      <Text color="gray.600">
        Здесь будут отображаться карточки, сгенерированные из PDF.
      </Text>

      <Box
        border="1px solid #ccc"
        p={4}
        borderRadius="md"
        bg="gray.50"
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="medium">
          Раздел в разработке
        </Text>
        <Text fontSize="sm" color="gray.500">
          Здесь позже появятся карточки на основе текста файла.
        </Text>
      </Box>
    </VStack>
  );
};

export default UploadCards;
