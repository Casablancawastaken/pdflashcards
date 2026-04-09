import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";

const NotFound = () => {
  return (
    <Box py={16}>
      <Seo
        title="404 — Страница не найдена | pdflashcards"
        description="Запрошенная страница не найдена."
        noindex
        canonical={`${window.location.origin}/404`}
      />

      <VStack spacing={4}>
        <Heading>404</Heading>
        <Text color="gray.600">Страница не найдена</Text>
        <Button as={Link} to="/" colorScheme="blue">
          На главную
        </Button>
      </VStack>
    </Box>
  );
};

export default NotFound;