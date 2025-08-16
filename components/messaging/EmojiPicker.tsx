'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Smile, Heart, ThumbsUp, Flame, Zap, Frown, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

const emojiCategories = {
  recent: {
    label: 'Récents',
    icon: <Smile className="h-4 w-4" />,
    emojis: ['👍', '❤️', '😂', '😊', '🎉', '🔥', '👏', '💯']
  },
  people: {
    label: 'Personnes',
    icon: <Smile className="h-4 w-4" />,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
      '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
      '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'
    ]
  },
  nature: {
    label: 'Nature',
    icon: <Heart className="h-4 w-4" />,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
      '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎'
    ]
  },
  food: {
    label: 'Nourriture',
    icon: <Flame className="h-4 w-4" />,
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅',
      '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕',
      '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨',
      '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓',
      '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪'
    ]
  },
  activities: {
    label: 'Activités',
    icon: <Zap className="h-4 w-4" />,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋',
      '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂',
      '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️',
      '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵'
    ]
  },
  objects: {
    label: 'Objets',
    icon: <ThumbsUp className="h-4 w-4" />,
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
      '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼',
      '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
      '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭',
      '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸'
    ]
  },
  symbols: {
    label: 'Symboles',
    icon: <Flame className="h-4 w-4" />,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'
    ]
  },
  flags: {
    label: 'Drapeaux',
    icon: <Flame className="h-4 w-4" />,
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴',
      '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿',
      '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮',
      '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸'
    ]
  }
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('recent')

  const filteredEmojis = searchQuery
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => {
          // Simple filtering - in a real app, you'd want emoji names/descriptions
          return true // For now, show all emojis when searching
        })
    : emojiCategories[activeCategory as keyof typeof emojiCategories]?.emojis || []

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white border rounded-lg shadow-lg w-80 h-96 flex flex-col"
    >
      {/* Header avec recherche */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {searchQuery ? (
          /* Résultats de recherche */
          <ScrollArea className="flex-1 p-2">
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-gray-100 text-lg"
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          /* Catégories */
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-7 h-10 mx-2 mt-2">
              {Object.entries(emojiCategories).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="p-1"
                  title={category.label}
                >
                  {category.icon}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(emojiCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="flex-1 m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-100 text-lg"
                        onClick={() => onEmojiSelect(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Cliquez sur un emoji pour l'ajouter
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Fermer
          </Button>
        </div>
      </div>
    </motion.div>
  )
}