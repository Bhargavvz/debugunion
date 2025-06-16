import { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Info, Loader2, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Conversation, Message, User as UserType } from '@/types';

interface MessagesPageProps {
  onViewProfile?: (id: string) => void;
}

export function MessagesPage({ onViewProfile }: MessagesPageProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newConversationDialog, setNewConversationDialog] = useState(false);
  const [newRecipientId, setNewRecipientId] = useState('');
  const [newRecipientUsername, setNewRecipientUsername] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const response = await apiService.getConversations();
          if (response.data.conversations) {
            setConversations(response.data.conversations);
            
            // Select the first conversation if none is selected
            if (response.data.conversations.length > 0 && !selectedConversation) {
              setSelectedConversation(response.data.conversations[0]);
            }
          }
        } catch (apiError: any) {
          // If the endpoint returns 404, use mock data instead
          if (apiError.response && apiError.response.status === 404) {
            console.log('Messages API not available, using mock data');
            // Mock conversation data
            const mockConversations = [
              {
                id: 'mock-1',
                participants: [
                  { id: 'user-1', username: 'Support Team', avatar: '' }
                ],
                lastMessage: {
                  content: 'Welcome to DebugUnion! How can we help you today?',
                  timestamp: new Date().toISOString(),
                  senderId: 'user-1'
                },
                unreadCount: 1
              }
            ];
            
            setConversations(mockConversations);
            if (!selectedConversation) {
              setSelectedConversation(mockConversations[0]);
            }
          } else {
            throw apiError; // Re-throw if it's not a 404
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
        
        // Set empty conversations as fallback
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [toast, selectedConversation]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      
      try {
        setLoadingMessages(true);
        
        try {
          const response = await apiService.getMessages(selectedConversation.id);
          if (response.data.messages) {
            setMessages(response.data.messages);
          }
        } catch (apiError: any) {
          // If the endpoint returns 404, use mock data instead
          if (apiError.response && apiError.response.status === 404) {
            console.log('Messages API not available, using mock data');
            
            // Mock messages data
            const mockMessages = [
              {
                id: 'msg-1',
                conversationId: selectedConversation.id,
                content: 'Welcome to DebugUnion! How can we help you today?',
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                senderId: 'user-1',
                sender: { id: 'user-1', username: 'Support Team', avatar: '' }
              },
              {
                id: 'msg-2',
                conversationId: selectedConversation.id,
                content: 'Our team is here to assist you with any technical issues or questions you might have.',
                timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
                senderId: 'user-1',
                sender: { id: 'user-1', username: 'Support Team', avatar: '' }
              }
            ];
            
            setMessages(mockMessages);
          } else {
            throw apiError; // Re-throw if it's not a 404
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
        
        // Set empty messages as fallback
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [selectedConversation, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      // Get the recipient user
      const recipient = selectedConversation.participants.find(
        user => user.id !== userProfile?.id
      );
      
      if (!recipient) {
        toast({
          title: 'Error',
          description: 'Recipient not found',
          variant: 'destructive',
        });
        return;
      }
      
      // Optimistically add the message to the UI
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        sender: userProfile as UserType,
        recipient: recipient,
        content: newMessage,
        createdAt: new Date(),
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'direct'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Send the message to the API
      const response = await apiService.sendMessage({
        recipientId: recipient.id,
        content: newMessage,
        type: 'direct'
      });
      
      // Replace the temp message with the real one
      if (response.data.message) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? response.data.message : msg)
        );
        
        // Update the conversation's last message
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === selectedConversation.id) {
              return {
                ...conv,
                lastMessage: response.data.message,
                updatedAt: new Date()
              };
            }
            return conv;
          })
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      
      // Remove the temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };

  // Search for users to start a new conversation
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchingUsers(true);
      
      const response = await apiService.getUsers({ q: query, limit: 5 });
      if (response.data.users) {
        // Filter out the current user
        const filteredUsers = response.data.users.filter(
          (user: UserType) => user.id !== userProfile?.id
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Start a new conversation
  const startNewConversation = async () => {
    if (!newRecipientId) {
      toast({
        title: 'Error',
        description: 'Please select a recipient',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participants.some(user => user.id === newRecipientId)
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv);
        setNewConversationDialog(false);
        return;
      }
      
      // Send an initial message to create the conversation
      const response = await apiService.sendMessage({
        recipientId: newRecipientId,
        content: `Hello! I'd like to start a conversation.`,
        type: 'direct'
      });
      
      if (response.data.conversation) {
        // Add the new conversation to the list
        setConversations(prev => [response.data.conversation, ...prev]);
        setSelectedConversation(response.data.conversation);
        
        toast({
          title: 'Success',
          description: `Started conversation with ${newRecipientUsername}`,
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      setNewConversationDialog(false);
      setNewRecipientId('');
      setNewRecipientUsername('');
      setSearchResults([]);
    }
  };

  // View user profile
  const handleViewProfile = (userId: string) => {
    if (onViewProfile) {
      onViewProfile(userId);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <Dialog open={newConversationDialog} onOpenChange={setNewConversationDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                  <DialogDescription>
                    Search for a user to start a conversation with.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Input
                      placeholder="Search by username or email..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchUsers(e.target.value);
                      }}
                    />
                    {searchingUsers && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <div
                          key={user.id}
                          className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-muted ${
                            newRecipientId === user.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => {
                            setNewRecipientId(user.id);
                            setNewRecipientUsername(user.username);
                          }}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ))
                    ) : searchTerm && !searchingUsers ? (
                      <p className="text-center text-muted-foreground py-2">No users found</p>
                    ) : null}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewConversationDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startNewConversation} disabled={!newRecipientId}>
                    Start Conversation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100%-5rem)]">
          {loading ? (
            <div className="p-2 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="mb-2">
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="p-2">
              {filteredConversations.map((conversation) => {
                const otherUser = conversation.participants.find(user => user.id !== userProfile?.id);
                if (!otherUser) return null;
                
                return (
                  <Card
                    key={conversation.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback>
                              {otherUser.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {otherUser.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{otherUser.username}</h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="mt-1 h-5 w-5 p-0 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
              <h3 className="font-medium mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a new conversation to connect with other developers
              </p>
              <Button onClick={() => setNewConversationDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const otherUser = selectedConversation.participants.find(user => user.id !== userProfile?.id);
                    return otherUser ? (
                      <>
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback>
                              {otherUser.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {otherUser.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{otherUser.username}</h3>
                          <p className="text-sm text-muted-foreground">
                            {otherUser.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(otherUser.lastActive), { addSuffix: true })}`}
                          </p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
                
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const otherUser = selectedConversation.participants.find(user => user.id !== userProfile?.id);
                        if (otherUser && onViewProfile) {
                          handleViewProfile(otherUser.id);
                        }
                      }}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${i % 2 === 0 ? '' : 'flex-row-reverse space-x-reverse'}`}>
                        {i % 2 === 0 && <Skeleton className="w-6 h-6 rounded-full" />}
                        <Skeleton className={`h-12 w-48 rounded-lg ${i % 2 === 0 ? '' : 'ml-auto'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.sender.id === userProfile?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isCurrentUser && (
                            <Avatar 
                              className="w-6 h-6 cursor-pointer" 
                              onClick={() => handleViewProfile(message.sender.id)}
                            >
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback className="text-xs">
                                {message.sender.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h3 className="font-medium mb-2">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
              <p className="text-muted-foreground mb-4">
                Choose a conversation from the sidebar or start a new one
              </p>
              <Button onClick={() => setNewConversationDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}