from mlagents_envs.side_channel.side_channel import SideChannel, IncomingMessage, OutgoingMessage
import uuid

class RLSideChannel(SideChannel):
    def __init__(self):
        super().__init__(uuid.UUID("b27b9e19-3fcd-4af9-8c71-64d59f878ce3"))
        
    def on_message_received(self, msg):
        return super().on_message_received(msg)
    
    def send_command(self, command: str, value:str):
        msg = OutgoingMessage()
        msg.write_string(command)
        msg.write_string(value)
        super().queue_message_to_send(msg)
        