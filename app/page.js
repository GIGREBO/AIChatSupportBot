'use client'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useRef, useEffect } from 'react'


export default function Home() {
 const [messages, setMessages] = useState([
   {
     role: 'assistant',
     content: "Hi! I am a support chatbot that will help you prepare for interviews. How can I help you today?",
   },
 ])
 const [message, setMessage] = useState('')
 const [isLoading, setIsLoading] = useState(false)


 const messagesEndRef = useRef(null) // Ref to the end of the messages list


 const scrollToBottom = () => {
   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) // Smoothly scroll to the end
 }

 useEffect(() => {
   scrollToBottom() // Scroll to bottom when messages update
 }, [messages])


 const sendMessage = async () => {
   if (!message.trim() || isLoading) return; // Don't send empty messages or if already loading
   setIsLoading(true)


   const userMessage = message.trim(); // Capture the user's message
   setMessage('') // Clear the input field


   setMessages((messages) => [
     ...messages,
     { role: 'user', content: userMessage }, // Add the user's message to the chat
     { role: 'assistant', content: '' }, // Add a placeholder for the assistant's response
   ])


   try {
     const response = await fetch('/api/chat', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify([...messages, { role: 'user', content: userMessage }]),
     })


     if (!response.ok) {
       throw new Error('Network response was not ok')
     }


     const reader = response.body.getReader()
     const decoder = new TextDecoder()


     let assistantMessage = ''; // Variable to accumulate the assistant's response
     while (true) {
       const { done, value } = await reader.read()
       if (done) break
       const text = decoder.decode(value, { stream: true })
       assistantMessage += text; // Accumulate the streamed text
       setMessages((messages) => {
         let lastMessage = messages[messages.length - 1]
         let otherMessages = messages.slice(0, messages.length - 1)
         return [
           ...otherMessages,
           { ...lastMessage, content: assistantMessage }, // Update the assistant's message in real-time
         ]
       })
     }
   } catch (error) {
     console.error('Error:', error)
     setMessages((messages) => [
       ...messages,
       { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
     ])
   } finally {
     setIsLoading(false) // Ensure loading state is reset
   }
 }


 const handleKeyPress = (event) => {
   if (event.key === 'Enter' && !event.shiftKey) {
     event.preventDefault()
     sendMessage()
   }
 }


 return (
   <Box
     width="100vw"
     height="100vh"
     display="flex"
     flexDirection="column"
     justifyContent="center"
     alignItems="center"
     bgcolor="white" // Set the background color to white
     p={2} // Add padding for spacing around the content
   >
     <Stack
       direction={'column'}
       width={{ xs: '90vw', sm: '70vw', md: '50vw', lg: '40vw' }} // Responsive width
       height={{ xs: '85vh', sm: '80vh', md: '75vh', lg: '70vh' }} // Increased height for all screen sizes
       border="1px solid black"
       borderRadius={8} // Rounded corners
       p={2}
       spacing={3}
       boxShadow={3} // Add some shadow for a subtle 3D effect
       bgcolor="white" // Ensure the box itself is white
     >
       <Stack
         direction={'column'}
         spacing={2}
         flexGrow={1}
         overflow="auto"
         maxHeight="100%"
       >
         {messages.map((message, index) => (
           <Box
             key={index}
             display="flex"
             justifyContent={
               message.role === 'assistant' ? 'flex-start' : 'flex-end'
             }
           >
             <Box
               bgcolor={
                 message.role === 'assistant'
                   ? 'primary.main'
                   : 'secondary.main'
               }
               color="white"
               borderRadius={16}
               p={3}
             >
               {message.content}
             </Box>
           </Box>
         ))}
         <div ref={messagesEndRef} /> {/* Scroll target */}
       </Stack>
       <Stack direction={'row'} spacing={2}>
         <TextField
           label="Message"
           fullWidth
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           onKeyPress={handleKeyPress}
           disabled={isLoading}
         />
         <Button
           variant="contained"
           onClick={sendMessage}
           disabled={isLoading}
         >
           {isLoading ? 'Sending...' : 'Send'}
         </Button>
       </Stack>
     </Stack>
   </Box>
 )
}
