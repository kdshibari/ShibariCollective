<AnimatePresence>
  {isOpen && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.3 }}
        className="bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col relative"
      >
        
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-border flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">How Do We Identify?</h2>
          <button 
            onClick={onClose} 
            className="text-primary/70 hover:text-primary text-3xl leading-none px-2 transition-colors duration-300"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div className="bg-background/50 p-4 rounded-lg border border-border shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-primary mb-3 sm:mb-4 border-b border-border pb-2">
              {myName || 'Me'}
            </h3>
            {renderSelect("Pronouns", meIdentity.pronouns, pronounsList, (val) => setMeIdentity({ ...meIdentity, pronouns: val }))}
            {renderSelect("Gender", meIdentity.gender, genderList, (val) => setMeIdentity({ ...meIdentity, gender: val }))}
            {renderSelect("Sexual Orientation", meIdentity.orientation, orientationList, (val) => setMeIdentity({ ...meIdentity, orientation: val }))}
            {renderSelect("Dating Preferences", meIdentity.relationship, relationshipList, (val) => setMeIdentity({ ...meIdentity, relationship: val }))}
          </div>

          <div className="bg-background/50 p-4 rounded-lg border border-border shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-primary mb-3 sm:mb-4 border-b border-border pb-2">
              {partnerName || 'Partner'}
            </h3>
            {renderSelect("Pronouns", partnerIdentity.pronouns, pronounsList, (val) => setPartnerIdentity({ ...partnerIdentity, pronouns: val }))}
            {renderSelect("Gender", partnerIdentity.gender, genderList, (val) => setPartnerIdentity({ ...partnerIdentity, gender: val }))}
            {renderSelect("Sexual Orientation", partnerIdentity.orientation, orientationList, (val) => setPartnerIdentity({ ...partnerIdentity, orientation: val }))}
            {renderSelect("Dating Preferences", partnerIdentity.relationship, relationshipList, (val) => setPartnerIdentity({ ...partnerIdentity, relationship: val }))}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 bg-card/90 backdrop-blur-md p-4 sm:p-6 border-t border-border rounded-b-xl">
          <button 
            onClick={onClose}
            className="w-full p-3 sm:p-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-bold transition-colors duration-300 text-sm sm:text-base shadow-md"
          >
            Save Identity Profile
          </button>
        </div>
        
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
