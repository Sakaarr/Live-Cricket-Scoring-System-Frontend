import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, Paper, Grid, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel, 
  Table, TableBody, TableCell, TableRow, Snackbar 
} from '@mui/material';
import Alert from '@mui/material/Alert';

// function Alert(props) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

const AdminPanel = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [innings, setInnings] = useState([]);
  const [selectedInning, setSelectedInning] = useState('');
  const [players, setPlayers] = useState([]);
  const [ballData, setBallData] = useState({
    batsman: '',
    bowler: '',
    runs: 0,
    is_wicket: false,
    extras: 0,
    over_number: 0,
    ball_number: 0
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matchesRes = await axios.get('http://localhost:8000/api/matches/');
        setMatches(matchesRes.data);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedMatch) return;
    
    const fetchInnings = async () => {
      try {
        const inningsRes = await axios.get(`http://localhost:8000/api/innings/?match=${selectedMatch}`);
        setInnings(inningsRes.data);
      } catch (error) {
        console.error('Error fetching innings:', error);
      }
    };
    
    fetchInnings();
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedInning) return;
    
    const fetchPlayers = async () => {
      try {
        const inningRes = await axios.get(`http://localhost:8000/api/innings/${selectedInning}/`);
        const inning = inningRes.data;
        
        const battingTeamRes = await axios.get(`http://localhost:8000/api/players/?team=${inning.batting_team}`);
        const bowlingTeamRes = await axios.get(`http://localhost:8000/api/players/?team=${inning.bowling_team}`);
        
        setPlayers({
          batting: battingTeamRes.data,
          bowling: bowlingTeamRes.data
        });
        
        // Get current over count
        const ballsRes = await axios.get(`http://localhost:8000/api/balls/?inning=${selectedInning}`);
        const balls = ballsRes.data;
        
        if (balls.length > 0) {
          const lastBall = balls[balls.length - 1];
          setBallData(prev => ({
            ...prev,
            over_number: lastBall.over_number,
            ball_number: lastBall.ball_number + 1
          }));
        } else {
          setBallData(prev => ({
            ...prev,
            over_number: 0,
            ball_number: 1
          }));
        }
        
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
    
    fetchPlayers();
  }, [selectedInning]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:8000/api/balls/', {
        ...ballData,
        inning: selectedInning
      });
      
      setSnackbarMessage('Ball added successfully!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      // Reset ball number for next ball
      setBallData(prev => ({
        ...prev,
        runs: 0,
        is_wicket: false,
        extras: 0,
        ball_number: prev.ball_number + 1
      }));
      
      // If ball was 6, increment over number
      if (ballData.ball_number === 6) {
        setBallData(prev => ({
          ...prev,
          over_number: prev.over_number + 1,
          ball_number: 1
        }));
      }
      
    } catch (error) {
      console.error('Error adding ball:', error);
      setSnackbarMessage('Error adding ball');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>Select Match</Typography>
            <FormControl fullWidth>
              <InputLabel>Match</InputLabel>
              <Select
                value={selectedMatch}
                onChange={(e) => setSelectedMatch(e.target.value)}
              >
                {matches.map(match => (
                  <MenuItem key={match.id} value={match.id}>
                    {match.team1.name} vs {match.team2.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedMatch && (
              <>
                <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>Select Inning</Typography>
                <FormControl fullWidth>
                  <InputLabel>Inning</InputLabel>
                  <Select
                    value={selectedInning}
                    onChange={(e) => setSelectedInning(e.target.value)}
                  >
                    {innings.map(inning => (
                      <MenuItem key={inning.id} value={inning.id}>
                        Inning {inning.inning_number}: {inning.batting_team.name} batting
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Paper>
        </Grid>
        
        {selectedInning && players.batting && players.bowling && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <Typography variant="h6" gutterBottom>Add Ball</Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography>Over: {ballData.over_number}.{ballData.ball_number}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Batsman</InputLabel>
                      <Select
                        value={ballData.batsman}
                        onChange={(e) => setBallData({...ballData, batsman: e.target.value})}
                        required
                      >
                        {players.batting.map(player => (
                          <MenuItem key={player.id} value={player.id}>
                            {player.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Bowler</InputLabel>
                      <Select
                        value={ballData.bowler}
                        onChange={(e) => setBallData({...ballData, bowler: e.target.value})}
                        required
                      >
                        {players.bowling.map(player => (
                          <MenuItem key={player.id} value={player.id}>
                            {player.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Runs"
                      type="number"
                      fullWidth
                      value={ballData.runs}
                      onChange={(e) => setBallData({...ballData, runs: parseInt(e.target.value) || 0})}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Extras</InputLabel>
                      <Select
                        value={ballData.extras}
                        onChange={(e) => setBallData({...ballData, extras: parseInt(e.target.value) || 0})}
                      >
                        <MenuItem value={0}>None</MenuItem>
                        <MenuItem value={1}>1 (Wide/No ball)</MenuItem>
                        <MenuItem value={2}>2 (Wide/No ball)</MenuItem>
                        <MenuItem value={4}>4 (Byes/Leg byes)</MenuItem>
                        <MenuItem value={5}>5 (Penalty)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Wicket</InputLabel>
                      <Select
                        value={ballData.is_wicket}
                        onChange={(e) => setBallData({...ballData, is_wicket: e.target.value})}
                      >
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      fullWidth
                    >
                      Add Ball
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminPanel;