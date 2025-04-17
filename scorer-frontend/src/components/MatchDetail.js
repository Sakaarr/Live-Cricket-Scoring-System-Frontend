import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  Typography, Paper, Grid, Card, CardContent, Divider, 
  Table, TableBody, TableCell, TableRow, Chip 
} from '@mui/material';

const MatchDetail = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [currentInning, setCurrentInning] = useState(null);
  const [balls, setBalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const [matchRes, inningsRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/matches/${id}/`),
          axios.get(`http://localhost:8000/api/innings/?match=${id}`)
        ]);
        
        setMatch(matchRes.data);
        
        if (inningsRes.data.length > 0) {
          const currentInn = inningsRes.data.find(inn => !inn.is_completed) || inningsRes.data[0];
          setCurrentInning(currentInn);
          
          const ballsRes = await axios.get(`http://localhost:8000/api/balls/?inning=${currentInn.id}`);
          setBalls(ballsRes.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
    };

    fetchMatchData();

    // Set up WebSocket connection
    const newSocket = io('ws://localhost:8000/ws/match/', {
      path: '/ws/match',
      query: { match_id: id }
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('match_update', (data) => {
      if (data.inning === currentInning?.id) {
        setBalls(prev => [...prev, data.ball]);
        setCurrentInning(data.inning_data);
      }
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [id]);

  if (loading) return <Typography>Loading match details...</Typography>;
  if (!match) return <Typography>Match not found</Typography>;

  return (
    <div style={{ marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>
        {match.team1.name} vs {match.team2.name}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            {currentInning ? (
              <>
                <Typography variant="h6">
                  {currentInning.batting_team.name}: {currentInning.total_runs}/{currentInning.wickets}
                </Typography>
                <Typography>
                  Overs: {currentInning.overs_completed}
                </Typography>
                
                <Divider style={{ margin: '15px 0' }} />
                
                <Typography variant="h6">Recent Balls</Typography>
                <Table>
                  <TableBody>
                    {balls.slice().reverse().slice(0, 10).map((ball, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {ball.over_number}.{ball.ball_number}
                        </TableCell>
                        <TableCell>
                          {ball.bowler.name} to {ball.batsman.name}
                        </TableCell>
                        <TableCell>
                          {ball.runs > 0 && `${ball.runs} run${ball.runs > 1 ? 's' : ''}`}
                          {ball.is_wicket && <Chip label="W" color="secondary" size="small" />}
                          {ball.extras > 0 && ` +${ball.extras} extras`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <Typography>Match not started yet</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Match Info</Typography>
              <Typography>Venue: {match.venue}</Typography>
              <Typography>Date: {new Date(match.date).toLocaleString()}</Typography>
              {match.toss_winner && (
                <Typography>
                  Toss: {match.toss_winner.name} chose to {match.toss_decision}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default MatchDetail;