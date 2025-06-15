import { useState } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockConversations, mockMessages, mockUsers } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

export function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = mockConversations.filter(conv =>
    conv.participants.some(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send the message via API
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
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
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.participants.find(user => user.id !== '1');
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
                            {formatDistanceToNow(conversation.lastMessage.createdAt, { addSuffix: true })}
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
                    const otherUser = selectedConversation.participants.find(user => user.id !== '1');
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
                            {otherUser.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(otherUser.lastActive, { addSuffix: true })}`}
                          </p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                      <DropdownMenuItem>Block User</DropdownMenuItem>
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
              <div className="space-y-4">
                {mockMessages.map((message) => {
                  const isCurrentUser = message.sender.id === '1';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isCurrentUser && (
                          <Avatar className="w-6 h-6">
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
                            {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-32 resize-none"
                  onKeyPress={(e) => {
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
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}