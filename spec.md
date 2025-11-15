For each promoptlet, there will be an option to expand to advanced settings. This will list the parameters to the OpenAI API call, with appropriate defaults.

Each setting will have an appropriate UI widget to allow the user to customise each promptlet. For example the Temperature option may have a slider widget.

Parameter	Type	Suggested Default	Notes
model	string	"gpt-3.5-turbo"	Choice of model; pick a lighter option for faster/cheaper output.
messages	array of {role,content}	—	Required: your conversation history. No default.
temperature	number (0-2)	0.7	Creativity vs predictability. Lower → deterministic, higher → creative.
top_p	number (0-1)	1.0	Nucleus sampling alternative to temperature. Use 1.0 to disable.
n	integer	1	Number of completions to generate. Higher → more outputs but more cost.
max_tokens	integer	256	Maximum number of tokens for the output. Adjust based on expected size.
presence_penalty	number (-2.0-2.0)	0.0	Penalizes new topics. Leave 0 unless you want less topic drift.
frequency_penalty	number (-2.0-2.0)	0.0	Penalizes repetition. Leave 0 unless you see repeated phrases.