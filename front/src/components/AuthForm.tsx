import { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

interface AuthFormProps {
  title: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  fields: { name: string; label: string; placeholder: string; type?: string }[];
  buttonText: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

const AuthForm = ({
  title,
  onSubmit,
  fields,
  buttonText,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthFormProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="440px"
      mx="auto"
      mt={24}
      p={10}
      borderWidth="2px"
      borderColor="blue.500"
      borderRadius="2xl"
      bg="white"
      boxShadow="lg"
    >

      <Text
        textAlign="center"
        fontSize="2xl"
        fontWeight="bold"
        color="blue.600"
        mb={6}
      >
        pdflashcards
      </Text>


      <Heading size="md" textAlign="center" mb={8}>
        {title}
      </Heading>

      <VStack spacing={5}>
        {fields.map((f) => (
          <FormControl key={f.name}>
            <FormLabel>{f.label}</FormLabel>
            <Input
              type={f.type || "text"}
              placeholder={f.placeholder}
              value={values[f.name] || ""}
              onChange={(e) => handleChange(f.name, e.target.value)}
            />
          </FormControl>
        ))}

        {error && <Text color="red.500">{error}</Text>}

        <Button
          colorScheme="blue"
          w="100%"
          size="lg"
          mt={2}
          onClick={handleSubmit}
          isLoading={loading}
        >
          {buttonText}
        </Button>


        <Text fontSize="sm" color="gray.600" mt={4}>
          {footerText}{" "}
          <Link to={footerLinkTo} style={{ color: "#2B6CB0", fontWeight: 500 }}>
            {footerLinkText}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default AuthForm;
